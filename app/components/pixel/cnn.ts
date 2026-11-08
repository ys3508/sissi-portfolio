// The forward pass of the PIXEL.exe CNN, in plain TypeScript.
// It must match scripts/train-mnist-cnn.py exactly: same layers, same order,
// same "same" padding, and the same channel-row-column flatten order.

export type FeatureMaps = { channels: number; size: number; data: Float32Array };

export type ModelFile = {
  name: string;
  trainedWith: string;
  dataset: string;
  testAccuracy: number;
  epochs: number;
  seed: number;
  augmentation: string;
  input: string;
  layers: {
    conv1: { weights: number[][][][]; bias: number[] };
    conv2: { weights: number[][][][]; bias: number[] };
    dense: { weights: number[][]; bias: number[] };
  };
};

export type Model = {
  meta: Omit<ModelFile, "layers">;
  conv1: { w: Float32Array; b: Float32Array; filters: number; channels: number; k: number };
  conv2: { w: Float32Array; b: Float32Array; filters: number; channels: number; k: number };
  dense: { w: Float32Array; b: Float32Array; inputs: number; outputs: number };
};

export type Trace = {
  input: FeatureMaps;
  conv1: FeatureMaps;
  relu1: FeatureMaps;
  pool1: FeatureMaps;
  conv2: FeatureMaps;
  relu2: FeatureMaps;
  pool2: FeatureMaps;
  flat: Float32Array;
  logits: Float32Array;
  probs: Float32Array;
  prediction: number;
};

export function parseModel(file: ModelFile): Model {
  const conv = (layer: { weights: number[][][][]; bias: number[] }) => ({
    w: Float32Array.from(layer.weights.flat(3)),
    b: Float32Array.from(layer.bias),
    filters: layer.weights.length,
    channels: layer.weights[0].length,
    k: layer.weights[0][0].length,
  });
  const { layers, ...meta } = file;
  return {
    meta,
    conv1: conv(layers.conv1),
    conv2: conv(layers.conv2),
    dense: {
      w: Float32Array.from(layers.dense.weights.flat()),
      b: Float32Array.from(layers.dense.bias),
      inputs: layers.dense.weights.length,
      outputs: layers.dense.bias.length,
    },
  };
}

function conv(x: FeatureMaps, layer: Model["conv1"]): FeatureMaps {
  const { w, b, filters, channels, k } = layer;
  const n = x.size;
  const pad = k >> 1;
  const out = new Float32Array(filters * n * n);
  for (let f = 0; f < filters; f++) {
    for (let y = 0; y < n; y++) {
      for (let xx = 0; xx < n; xx++) {
        let sum = b[f];
        for (let c = 0; c < channels; c++) {
          for (let i = 0; i < k; i++) {
            const sy = y + i - pad;
            if (sy < 0 || sy >= n) continue;
            for (let j = 0; j < k; j++) {
              const sx = xx + j - pad;
              if (sx < 0 || sx >= n) continue;
              sum += x.data[(c * n + sy) * n + sx] * w[((f * channels + c) * k + i) * k + j];
            }
          }
        }
        out[(f * n + y) * n + xx] = sum;
      }
    }
  }
  return { channels: filters, size: n, data: out };
}

const relu = (x: FeatureMaps): FeatureMaps => ({ ...x, data: x.data.map((v) => (v > 0 ? v : 0)) });

function pool(x: FeatureMaps): FeatureMaps {
  const n = x.size;
  const m = n >> 1;
  const out = new Float32Array(x.channels * m * m);
  for (let c = 0; c < x.channels; c++) {
    for (let y = 0; y < m; y++) {
      for (let xx = 0; xx < m; xx++) {
        const at = (dy: number, dx: number) => x.data[(c * n + y * 2 + dy) * n + xx * 2 + dx];
        out[(c * m + y) * m + xx] = Math.max(at(0, 0), at(0, 1), at(1, 0), at(1, 1));
      }
    }
  }
  return { channels: x.channels, size: m, data: out };
}

export function softmax(logits: Float32Array) {
  let max = -Infinity;
  for (const v of Array.from(logits)) if (v > max) max = v;
  const e = logits.map((v) => Math.exp(v - max));
  const sum = e.reduce((a, v) => a + v, 0);
  return e.map((v) => v / sum);
}

/** Run the network on a 28x28 image (white digit on black, 0..1) and keep every layer's output. */
export function run(model: Model, pixels: Float32Array): Trace {
  const input: FeatureMaps = { channels: 1, size: 28, data: pixels };
  const conv1 = conv(input, model.conv1);
  const relu1 = relu(conv1);
  const pool1 = pool(relu1);
  const conv2 = conv(pool1, model.conv2);
  const relu2 = relu(conv2);
  const pool2 = pool(relu2);
  const flat = pool2.data;
  const { w, b, inputs, outputs } = model.dense;
  const logits = new Float32Array(outputs);
  for (let o = 0; o < outputs; o++) {
    let sum = b[o];
    for (let i = 0; i < inputs; i++) sum += flat[i] * w[i * outputs + o];
    logits[o] = sum;
  }
  const probs = softmax(logits);
  let prediction = 0;
  for (let i = 1; i < outputs; i++) if (probs[i] > probs[prediction]) prediction = i;
  return { input, conv1, relu1, pool1, conv2, relu2, pool2, flat, logits, probs, prediction };
}

export function kernel(model: Model, layer: "conv1" | "conv2", filter: number, channel = 0) {
  const { w, channels, k } = model[layer];
  const start = (filter * channels + channel) * k * k;
  return { size: k, data: w.slice(start, start + k * k) };
}

/**
 * Turn a square grayscale drawing (ink 0..1) into an MNIST-style input:
 * crop to the ink, scale the longest side to 20 pixels, and place it in a
 * 28x28 frame so its center of mass sits in the middle, as MNIST does.
 */
export function preprocess(gray: Float32Array, side: number): Float32Array | null {
  let minX = side,
    minY = side,
    maxX = -1,
    maxY = -1;
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      if (gray[y * side + x] > 0.1) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const scale = 20 / Math.max(bw, bh);
  const tw = Math.max(1, Math.round(bw * scale));
  const th = Math.max(1, Math.round(bh * scale));

  // Area averaging: each small pixel is the mean of the block of source pixels it covers.
  const small = new Float32Array(tw * th);
  for (let ty = 0; ty < th; ty++) {
    const y0 = minY + Math.floor((ty * bh) / th);
    const y1 = Math.max(y0 + 1, minY + Math.floor(((ty + 1) * bh) / th));
    for (let tx = 0; tx < tw; tx++) {
      const x0 = minX + Math.floor((tx * bw) / tw);
      const x1 = Math.max(x0 + 1, minX + Math.floor(((tx + 1) * bw) / tw));
      let sum = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) sum += gray[y * side + x];
      small[ty * tw + tx] = sum / ((y1 - y0) * (x1 - x0));
    }
  }

  let mass = 0,
    cx = 0,
    cy = 0;
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const v = small[y * tw + x];
      mass += v;
      cx += v * x;
      cy += v * y;
    }
  }
  const ox = Math.min(28 - tw, Math.max(0, Math.round(14 - cx / mass - 0.5)));
  const oy = Math.min(28 - th, Math.max(0, Math.round(14 - cy / mass - 0.5)));
  const out = new Float32Array(784);
  for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) out[(oy + y) * 28 + ox + x] = Math.min(1, small[y * tw + x]);
  return out;
}
