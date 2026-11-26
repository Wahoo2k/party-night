// Trivia Board question bank. Each category has 4 clues, easiest first.
// a = accepted answers (first is shown); keep facts well established and family-friendly.
export const CATEGORIES = [
  { name: 'Animal Kingdom', clues: [
    { q: 'This big cat is called the "King of the Jungle."', a: ['Lion'] },
    { q: 'The fastest land animal on Earth.', a: ['Cheetah'] },
    { q: 'A baby goat is called this.', a: ['Kid'] },
    { q: 'The only mammal that can truly fly.', a: ['Bat'] },
  ] },
  { name: 'Space', clues: [
    { q: 'This planet is nicknamed the Red Planet.', a: ['Mars'] },
    { q: 'The largest planet in our solar system.', a: ['Jupiter'] },
    { q: 'This planet is best known for its huge, bright rings.', a: ['Saturn'] },
    { q: 'The first person to walk on the Moon.', a: ['Neil Armstrong', 'Armstrong'] },
  ] },
  { name: 'U.S. Geography', clues: [
    { q: 'This state is nicknamed the Sunshine State.', a: ['Florida'] },
    { q: 'The largest U.S. state by area.', a: ['Alaska'] },
    { q: 'The capital of Texas.', a: ['Austin'] },
    { q: 'Mount Rushmore is in this state.', a: ['South Dakota'] },
  ] },
  { name: 'Food Fun', clues: [
    { q: 'Guacamole is made mostly from this fruit.', a: ['Avocado', 'Avocados'] },
    { q: 'French fries are traditionally made from this vegetable.', a: ['Potato', 'Potatoes'] },
    { q: 'The main ingredient in hummus.', a: ['Chickpeas', 'Chickpea', 'Garbanzo beans', 'Garbanzo'] },
    { q: 'This pricey spice comes from the dried threads of a crocus flower.', a: ['Saffron'] },
  ] },
  { name: 'Animated Movies', clues: [
    { q: 'The snowman who loves warm hugs in "Frozen."', a: ['Olaf'] },
    { q: 'The cowboy doll in "Toy Story."', a: ['Woody', 'Sheriff Woody'] },
    { q: 'Nemo\'s worried clownfish dad in "Finding Nemo."', a: ['Marlin'] },
    { q: 'The rat who becomes a chef in "Ratatouille."', a: ['Remy'] },
  ] },
  { name: 'Sports', clues: [
    { q: 'The number of players each team has on the field in soccer.', a: ['11', 'Eleven'] },
    { q: 'The sport played at Wimbledon.', a: ['Tennis'] },
    { q: 'In bowling, three strikes in a row is called this bird.', a: ['Turkey'] },
    { q: 'The country that has won the most men\'s soccer World Cups.', a: ['Brazil'] },
  ] },
  { name: 'Human Body', clues: [
    { q: 'The largest organ of the human body.', a: ['Skin'] },
    { q: 'The colored part of your eye.', a: ['Iris'] },
    { q: 'The number of bones in an adult human body.', a: ['206'] },
    { q: 'The longest bone in the human body.', a: ['Femur', 'Thigh bone', 'Thighbone'] },
  ] },
  { name: 'History', clues: [
    { q: 'The first President of the United States.', a: ['George Washington', 'Washington'] },
    { q: 'This famous ship sank in 1912 after hitting an iceberg.', a: ['Titanic', 'RMS Titanic'] },
    { q: 'The year Columbus first reached the Americas.', a: ['1492'] },
    { q: 'The only one of the Seven Wonders of the Ancient World still standing.', a: ['Great Pyramid of Giza', 'Great Pyramid', 'Pyramid of Giza', 'Pyramids', 'Pyramid'] },
  ] },
  { name: 'Word Play', clues: [
    { q: 'A word that means the opposite of another word.', a: ['Antonym'] },
    { q: 'A word that reads the same backward and forward, like "racecar."', a: ['Palindrome'] },
    { q: 'Words that sound alike but mean different things, like "pair" and "pear."', a: ['Homophones', 'Homophone'] },
    { q: 'A word made by rearranging another word\'s letters, like "listen" and "silent."', a: ['Anagram'] },
  ] },
  { name: 'Science', clues: [
    { q: 'H2O is the chemical formula for this.', a: ['Water'] },
    { q: 'Water freezes at this many degrees Fahrenheit.', a: ['32'] },
    { q: 'Plants take in this gas from the air to make food.', a: ['Carbon dioxide', 'CO2'] },
    { q: 'The center of an atom.', a: ['Nucleus'] },
  ] },
  { name: 'Music', clues: [
    { q: 'This instrument usually has 88 keys.', a: ['Piano'] },
    { q: 'The number of strings on a standard guitar.', a: ['6', 'Six'] },
    { q: 'The singer known as the "King of Pop."', a: ['Michael Jackson', 'Jackson'] },
    { q: 'He composed the "Moonlight Sonata."', a: ['Beethoven', 'Ludwig van Beethoven'] },
  ] },
  { name: 'World Capitals', clues: [
    { q: 'The capital of France.', a: ['Paris'] },
    { q: 'The capital of Japan.', a: ['Tokyo'] },
    { q: 'The capital of Canada.', a: ['Ottawa'] },
    { q: 'The capital of Australia.', a: ['Canberra'] },
  ] },
];

export const FINALS = [
  { cat: 'Inventors', q: 'He was granted the first U.S. patent for the telephone in 1876.', a: ['Alexander Graham Bell', 'Graham Bell', 'Bell'] },
  { cat: 'Landmarks', q: 'This country gave the Statue of Liberty to the United States.', a: ['France'] },
  { cat: 'Rivers', q: 'The longest river in Africa.', a: ['Nile', 'Nile River', 'The Nile'] },
  { cat: 'Big Animals', q: 'The largest animal known to have ever lived.', a: ['Blue whale'] },
  { cat: 'Ocean', q: 'The largest ocean on Earth.', a: ['Pacific', 'Pacific Ocean'] },
];
