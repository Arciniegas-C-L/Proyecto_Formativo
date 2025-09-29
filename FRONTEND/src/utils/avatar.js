// src/utils/avatar.js

export const availableOptions = {
  backgroundColor: { enum: ["65c9ff","5199e4","25557c","e6e6e6","929598","3c4f5c","b1e2ff","a7ffc4","ffdeb5","ffafb9","ffffb1","ff488e","ff5c5c","ffffff"] },
  accessories: { enum: ["kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers", "eyepatch"] },
  top: { enum: ["hat","hijab","turban","winterHat1","winterHat02","winterHat03","winterHat04","bob","bun","curly","curvy","dreads","frida","fro","froBand","longButNotTooLong","miaWallace","shavedSides","straight02","straight01","straightAndStrand","dreads01","dreads02","frizzle","shaggy","shaggyMullet","shortCurly","shortFlat","shortRound","shortWaved","sides","theCaesar","theCaesarAndSidePart","bigHair"] },
  hairColor: { enum: ["a55728","2c1b18","b58143","d6b370","724133","4a312c","f59797","ecdcbf","c93305","e8e1e1"] },
  clothing: { enum: ["blazerAndShirt","blazerAndSweater","collarAndSweater","graphicShirt","hoodie","overall","shirtCrewNeck","shirtScoopNeck","shirtVNeck"] },
  clothingColor: { enum: ["262e33","65c9ff","5199e4","25557c","e6e6e6","929598","3c4f5c","b1e2ff","a7ffc4","ffafb9","ffffb1","ff488e","ff5c5c","ffffff"] },
  eyes: { enum: ["closed","cry","default","eyeRoll","happy","hearts","side","squint","surprised","winkWacky","wink","xDizzy"] },
  eyebrows: { enum: ["angryNatural","defaultNatural","flatNatural","frownNatural","raisedExcitedNatural","sadConcernedNatural","unibrowNatural","upDownNatural","angry","default","raisedExcited","sadConcerned","upDown"] },
  mouth: { enum: ["concerned","default","disbelief","eating","grimace","sad","screamOpen","serious","smile","tongue","twinkle","vomit"] },
  facialHair: { enum: ["beardLight","beardMajestic","beardMedium","moustacheFancy","moustacheMagnum"] },
  facialHairColor: { enum: ["a55728","2c1b18","b58143","d6b370","724133","4a312c","f59797","ecdcbf","c93305","e8e1e1"] },
  skinColor: { enum: ["614335","d08b5b","ae5d29","edb98a","ffdbb4","fd9841","f8d25c"] }
};

const toArrayParam = (value) => Array.isArray(value) ? value.join(",") : value;

export function generateAvatarUrl(options = {}, seed = "") {
  const getValidValue = (category, value, fallback) => {
    const validValues = availableOptions[category]?.enum || [];
    return validValues.includes(value) ? value : fallback;
  };
  const validOptions = {
    backgroundColor: getValidValue('backgroundColor', options.backgroundColor, '65c9ff'),
    accessories: getValidValue('accessories', options.accessories, 'kurt'),
    top: getValidValue('top', options.top, 'bigHair'),
    hairColor: getValidValue('hairColor', options.hairColor, '2c1b18'),
    clothing: getValidValue('clothing', options.clothing, 'blazerAndShirt'),
    clothingColor: getValidValue('clothingColor', options.clothingColor, '262e33'),
    eyes: getValidValue('eyes', options.eyes, 'default'),
    eyebrows: getValidValue('eyebrows', options.eyebrows, 'default'),
    mouth: getValidValue('mouth', options.mouth, 'smile'),
    facialHair: getValidValue('facialHair', options.facialHair, 'beardLight'),
    facialHairColor: getValidValue('facialHairColor', options.facialHairColor, 'a55728'),
    skinColor: getValidValue('skinColor', options.skinColor, 'ffdbb4')
  };
  const params = new URLSearchParams({
    seed,
    backgroundColor: toArrayParam([validOptions.backgroundColor]),
    accessories: toArrayParam([validOptions.accessories]),
    accessoriesProbability: 100,
    top: toArrayParam([validOptions.top]),
    hairColor: toArrayParam([validOptions.hairColor]),
    clothing: toArrayParam([validOptions.clothing]),
    clothesColor: toArrayParam([validOptions.clothingColor]),
    eyes: toArrayParam([validOptions.eyes]),
    eyebrows: toArrayParam([validOptions.eyebrows]),
    mouth: toArrayParam([validOptions.mouth]),
    facialHair: toArrayParam([validOptions.facialHair]),
    facialHairColor: toArrayParam([validOptions.facialHairColor]),
    facialHairProbability: 0,
    skinColor: toArrayParam([validOptions.skinColor]),
    size: 200
  });
  return `https://api.dicebear.com/9.x/avataaars/svg?${params.toString()}`;
}
