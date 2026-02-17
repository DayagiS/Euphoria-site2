
import { Product } from './types';

export interface ExtendedProduct extends Product {
  soldOutSizes?: string[];
}

/**
 * PERMANENT INSTRUCTIONS:
 * To make your photos permanent, upload them to an image hosting site (like postimages.org).
 * Replace the filenames below (e.g., 'be-free-back.jpg') with the Direct Link URL.
 */
export const PRODUCTS: ExtendedProduct[] = [
  {
    id: 'euphoria-01',
    name: 'Be Free Tee',
    price: 125,
    description: '100% 250 GSM Combed Cotton. Heavyweight oversized fit. Minimalist butterfly motif.',
    images: [
      'https://i.postimg.cc/T3f8Ds5H/Whats_App_Image_2026_01_24_at_15_27_01_(3).jpg',
      'https://i.postimg.cc/65dJTKTs/Whats_App_Image_2026_01_24_at_15_27_03_(1).jpg',
      'https://i.postimg.cc/D09jnSLM/Whats_App_Image_2026_01_24_at_15_27_03.jpg'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    soldOutSizes: ['S']
  },
  {
    id: 'euphoria-02',
    name: 'Angelic Tee',
    price: 125,
    description: '100% 250 GSM Combed Cotton. Heavyweight oversized fit. Minimalist angel motif.',
    images: [
      'https://i.postimg.cc/284R3Yyt/Whats_App_Image_2026_01_24_at_15_27_01_(1).jpg',
      'https://i.postimg.cc/8PhQsGc3/Whats_App_Image_2026_01_24_at_15_27_01.jpg',
      'https://i.postimg.cc/TYrMhx1g/Whats_App_Image_2026_01_24_at_15_27_01_(2).jpg'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    soldOutSizes: []
  }
];

export const BRAND_PHONE = "0584892346";
export const BRAND_NAME = "Euphoria";
export const DESIGNER_NAME = "Shahar Dayagi";
