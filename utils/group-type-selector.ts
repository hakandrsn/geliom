export const groupTypeSelector = (type: string) => {
  switch (type) {
    case 'family':
      return 'Your Family';
    case 'friends':
      return 'Your Friends';
    case 'work':
      return 'Your work friends';
    default:
      return 'Your Group';
  }
};