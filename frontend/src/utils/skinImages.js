const DEFAULT_IMG = require('../../assets/꼬부기.png');

export const SKIN_IMAGES = {
  fire:   require('../../assets/skins/fire.png'),
  ice:    require('../../assets/skins/ice.png'),
  gold:   require('../../assets/skins/gold.png'),
  sakura: require('../../assets/skins/sakura.png'),
  space:  require('../../assets/skins/space.png'),
};

export function getSkinImage(image_key) {
  if (!image_key) return DEFAULT_IMG;
  return SKIN_IMAGES[image_key] || DEFAULT_IMG;
}

export const DEFAULT_TURTLE = DEFAULT_IMG;
