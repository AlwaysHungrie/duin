export const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const truncateText = (text: string, maxLength: number = 100) => {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};
