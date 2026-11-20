export const devLog = (...args: unknown[]) => {
  if (__DEV__) {
    console.log(...args);
  }
};
