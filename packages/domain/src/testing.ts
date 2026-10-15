/** Random UUIDv7 for test fixtures: 48-bit timestamp + version 7 + variant bits. */
export const makeUuidV7 = (): string => {
  const time = Date.now().toString(16).padStart(12, '0');
  const rand = () =>
    Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, '0');
  const variant = ['8', '9', 'a', 'b'][Math.floor(Math.random() * 4)];
  return `${time.slice(0, 8)}-${time.slice(8, 12)}-7${rand().slice(1)}-${variant}${rand().slice(1)}-${rand()}${rand()}${rand()}`;
};
