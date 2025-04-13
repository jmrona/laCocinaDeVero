export const getDishes = async () => {
  const response = await fetch('http://localhost:3001/dishes');
  return response.json();
}