import { Document } from "mongoose";
import USER_TYPE from "./user";

export type PRODUCT_IMAGE = {
  imageUrl: string;
  imagePath: string;
};

export type PRODUCT_STATUS = "ACTIVE" | "PENDING" | "DISABLE";
export default interface PRODUCT_TYPE extends Document {
  title: string;
  description: string;
  ownerName: string;
  ownerMobileNumber: string;
  ownerWhatsAppNumber?: string;
  totalFloor: number;
  status: PRODUCT_STATUS;
  isSoldOut: boolean;
  floorNumber: number;
  bhkType: BHK_TYPE;
  category: PRODUCT_CATEGORY_TYPE;
  listedBy: USER_TYPE;
  price: number;
  productImages: PRODUCT_IMAGE[];
}
