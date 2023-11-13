import os from 'os';

export const delay = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms * (os.platform() === 'linux' ? 3 : 1)),
  );
