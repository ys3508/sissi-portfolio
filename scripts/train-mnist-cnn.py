"""Train the small MNIST CNN used by PIXEL.exe, with NumPy only.

Usage:
    python3 scripts/train-mnist-cnn.py --data /some/cache/dir --out public/pixel/mnist-cnn.json

Architecture (must match app/components/pixel/cnn.ts):
    input   1x28x28, white digit on black, values 0..1
    conv1   8 filters 5x5, stride 1, same padding  -> 8x28x28
    relu
    pool1   2x2 max                               -> 8x14x14
    conv2   16 filters 3x3, stride 1, same padding -> 16x14x14
    relu
    pool2   2x2 max                               -> 16x7x7
    flatten (channel, row, column order)           -> 784
    dense   784 -> 10
    softmax

MNIST comes from the Google CVDF mirror of Yann LeCun's original files. The data
is cached outside the repository and is not redistributed with the site.
"""

import argparse
import gzip
import json
import os
import time
import urllib.request

import numpy as np

MIRROR = "https://storage.googleapis.com/cvdf-datasets/mnist/"
FILES = {
    "train_x": "train-images-idx3-ubyte.gz",
    "train_y": "train-labels-idx1-ubyte.gz",
    "test_x": "t10k-images-idx3-ubyte.gz",
    "test_y": "t10k-labels-idx1-ubyte.gz",
}


def load(data_dir):
    os.makedirs(data_dir, exist_ok=True)
    out = {}
    for key, name in FILES.items():
        path = os.path.join(data_dir, name)
        if not os.path.exists(path):
            print("downloading", name)
            urllib.request.urlretrieve(MIRROR + name, path)
        with gzip.open(path, "rb") as f:
            raw = f.read()
        magic = int.from_bytes(raw[:4], "big")
        if key.endswith("_x"):
            assert magic == 2051, f"{name}: bad magic {magic}"
            n, rows, cols = (int.from_bytes(raw[i : i + 4], "big") for i in (4, 8, 12))
            out[key] = np.frombuffer(raw, np.uint8, offset=16).reshape(n, 1, rows, cols).astype(np.float32) / 255.0
        else:
            assert magic == 2049, f"{name}: bad magic {magic}"
            out[key] = np.frombuffer(raw, np.uint8, offset=8).astype(np.int64)
    assert out["train_x"].shape == (60000, 1, 28, 28) and out["test_x"].shape == (10000, 1, 28, 28)
    return out


def im2col(x, k, pad):
    """x: (N, C, H, W) -> (N, H, W, C*k*k) for stride-1 'same' convolution."""
    n, c, h, w = x.shape
    xp = np.pad(x, ((0, 0), (0, 0), (pad, pad), (pad, pad)))
    cols = np.empty((n, c, k, k, h, w), dtype=x.dtype)
    for i in range(k):
        for j in range(k):
            cols[:, :, i, j] = xp[:, :, i : i + h, j : j + w]
    return cols.transpose(0, 4, 5, 1, 2, 3).reshape(n, h, w, c * k * k)


def col2im(dcols, shape, k, pad):
    n, c, h, w = shape
    d = dcols.reshape(n, h, w, c, k, k).transpose(0, 3, 4, 5, 1, 2)
    dxp = np.zeros((n, c, h + 2 * pad, w + 2 * pad), dtype=dcols.dtype)
    for i in range(k):
        for j in range(k):
            dxp[:, :, i : i + h, j : j + w] += d[:, :, i, j]
    return dxp[:, :, pad : pad + h, pad : pad + w]


def conv_forward(x, W, b):
    f, c, k, _ = W.shape
    cols = im2col(x, k, k // 2)
    out = cols @ W.reshape(f, -1).T + b
    return out.transpose(0, 3, 1, 2), cols


def conv_backward(dout, cols, x_shape, W, need_dx):
    f, c, k, _ = W.shape
    d = dout.transpose(0, 2, 3, 1).reshape(-1, f)
    dW = (cols.reshape(-1, c * k * k).T @ d).T.reshape(W.shape)
    db = d.sum(0)
    dx = col2im((d @ W.reshape(f, -1)).reshape(*cols.shape), x_shape, k, k // 2) if need_dx else None
    return dx, dW, db


def pool_forward(x):
    n, c, h, w = x.shape
    r = x.reshape(n, c, h // 2, 2, w // 2, 2)
    out = r.max(axis=(3, 5))
    mask = r == out[:, :, :, None, :, None]
    return out, mask


def pool_backward(dout, mask):
    d = mask * dout[:, :, :, None, :, None]
    d = d / np.maximum(mask.sum(axis=(3, 5), keepdims=True), 1)
    n, c, h2, _, w2, _ = mask.shape
    return d.reshape(n, c, h2 * 2, w2 * 2)


def forward(x, p):
    z1, cols1 = conv_forward(x, p["W1"], p["b1"])
    a1 = np.maximum(z1, 0)
    p1, m1 = pool_forward(a1)
    z2, cols2 = conv_forward(p1, p["W2"], p["b2"])
    a2 = np.maximum(z2, 0)
    p2, m2 = pool_forward(a2)
    flat = p2.reshape(len(x), -1)
    logits = flat @ p["W3"] + p["b3"]
    cache = (x, z1, cols1, p1, m1, z2, cols2, m2, flat)
    return logits, cache


def softmax(z):
    e = np.exp(z - z.max(1, keepdims=True))
    return e / e.sum(1, keepdims=True)


def backward(logits, y, cache, p):
    x, z1, cols1, p1, m1, z2, cols2, m2, flat = cache
    n = len(x)
    dlog = softmax(logits)
    dlog[np.arange(n), y] -= 1
    dlog /= n
    g = {"W3": flat.T @ dlog, "b3": dlog.sum(0)}
    dflat = dlog @ p["W3"].T
    dp2 = dflat.reshape(n, 16, 7, 7)
    da2 = pool_backward(dp2, m2) * (z2 > 0)
    dp1, g["W2"], g["b2"] = conv_backward(da2, cols2, p1.shape, p["W2"], True)
    da1 = pool_backward(dp1, m1) * (z1 > 0)
    _, g["W1"], g["b1"] = conv_backward(da1, cols1, x.shape, p["W1"], False)
    return g


def shift(batch, rng, max_shift=2):
    """Random translation of up to 2 pixels, filling with background."""
    out = np.zeros_like(batch)
    for i in range(len(batch)):
        dy, dx = rng.integers(-max_shift, max_shift + 1, size=2)
        src = batch[i, 0]
        ys, yd = (slice(0, 28 - dy), slice(dy, 28)) if dy >= 0 else (slice(-dy, 28), slice(0, 28 + dy))
        xs, xd = (slice(0, 28 - dx), slice(dx, 28)) if dx >= 0 else (slice(-dx, 28), slice(0, 28 + dx))
        out[i, 0, yd, xd] = src[ys, xs]
    return out


def evaluate(x, y, p):
    correct = 0
    for i in range(0, len(x), 500):
        logits, _ = forward(x[i : i + 500], p)
        correct += int((logits.argmax(1) == y[i : i + 500]).sum())
    return correct / len(x)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--parity", help="optional path for a few test inputs and outputs, to check the browser code")
    ap.add_argument("--epochs", type=int, default=4)
    ap.add_argument("--seed", type=int, default=500)
    args = ap.parse_args()

    rng = np.random.default_rng(args.seed)
    d = load(args.data)

    def he(shape, fan_in):
        return (rng.standard_normal(shape) * np.sqrt(2.0 / fan_in)).astype(np.float32)

    p = {
        "W1": he((8, 1, 5, 5), 25),
        "b1": np.zeros(8, np.float32),
        "W2": he((16, 8, 3, 3), 72),
        "b2": np.zeros(16, np.float32),
        "W3": (rng.standard_normal((784, 10)) * np.sqrt(1.0 / 784)).astype(np.float32),
        "b3": np.zeros(10, np.float32),
    }
    m = {k: np.zeros_like(v) for k, v in p.items()}
    v = {k: np.zeros_like(v) for k, v in p.items()}
    step, lr, b1, b2, eps, batch = 0, 2e-3, 0.9, 0.999, 1e-8, 64

    for epoch in range(args.epochs):
        start = time.time()
        order = rng.permutation(60000)
        rate = lr * (0.5 ** epoch)
        loss_sum = 0.0
        for i in range(0, 60000, batch):
            idx = order[i : i + batch]
            xb = shift(d["train_x"][idx], rng)
            yb = d["train_y"][idx]
            logits, cache = forward(xb, p)
            probs = softmax(logits)
            loss_sum += float(-np.log(probs[np.arange(len(yb)), yb] + 1e-9).sum())
            g = backward(logits, yb, cache, p)
            step += 1
            for k in p:
                m[k] = b1 * m[k] + (1 - b1) * g[k]
                v[k] = b2 * v[k] + (1 - b2) * g[k] ** 2
                mh = m[k] / (1 - b1**step)
                vh = v[k] / (1 - b2**step)
                p[k] -= (rate * mh / (np.sqrt(vh) + eps)).astype(np.float32)
        acc = evaluate(d["test_x"], d["test_y"], p)
        print(f"epoch {epoch + 1}: train loss {loss_sum / 60000:.4f}, test accuracy {acc:.4f}, {time.time() - start:.0f}s", flush=True)

    acc = evaluate(d["test_x"], d["test_y"], p)
    model = {
        "name": "PIXEL.exe MNIST CNN",
        "trainedWith": "scripts/train-mnist-cnn.py (NumPy only)",
        "dataset": "MNIST, 60,000 training images; evaluated on the 10,000 official test images",
        "testAccuracy": round(acc, 4),
        "epochs": args.epochs,
        "seed": args.seed,
        "augmentation": "random shifts of up to 2 pixels",
        "input": "1x28x28, white digit on black, values 0..1, centered by center of mass",
        "layers": {
            "conv1": {"weights": np.round(p["W1"], 5).tolist(), "bias": np.round(p["b1"], 5).tolist()},
            "conv2": {"weights": np.round(p["W2"], 5).tolist(), "bias": np.round(p["b2"], 5).tolist()},
            "dense": {"weights": np.round(p["W3"], 5).tolist(), "bias": np.round(p["b3"], 5).tolist()},
        },
    }
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w") as f:
        json.dump(model, f, separators=(",", ":"))
    print("saved", args.out, f"test accuracy {acc:.4f}")

    if args.parity:
        q = {k: np.round(vv, 5).astype(np.float32) for k, vv in p.items()}
        xs = d["test_x"][:8]
        logits, _ = forward(xs, q)
        with open(args.parity, "w") as f:
            json.dump(
                {"inputs": xs.reshape(8, -1).round(5).tolist(), "labels": d["test_y"][:8].tolist(), "probs": softmax(logits).tolist()},
                f,
            )
        print("saved parity samples to", args.parity)


if __name__ == "__main__":
    main()
