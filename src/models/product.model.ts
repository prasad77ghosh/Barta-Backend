import { model, Model, Schema } from "mongoose";
import PRODUCT_TYPE from "../types/product";

const productSchema = new Schema<PRODUCT_TYPE, Model<PRODUCT_TYPE>>(
  {
    title: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "PENDING", "DISABLE", "DELETED"],
        message: 'Status must be "ACTIVE", "PENDING", "DISABLE", "DELETED',
      },
      default: "PENDING",
    },

    isSoldOut: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
    ownerName: {
      type: String,
      trim: true,
    },
    ownerMobileNumber: {
      type: String,
    },

    ownerWhatsAppNumber: {
      type: String,
    },

    totalFloor: {
      type: Number,
    },

    floorNumber: {
      type: Number,
    },

    price: {
      type: Number,
    },

    productImages: [
      {
        imagePath: {
          type: String,
        },
        imageUrl: {
          type: String,
        },
      },
    ],

    listedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const ProductSchema = model<PRODUCT_TYPE, Model<PRODUCT_TYPE>>(
  "Product",
  productSchema
);
export default ProductSchema;
