import { NextFunction, Request, Response } from "express";
import { MIDDLEWARE_REQUEST_TYPE } from "../types/global";
import PRODUCT_TYPE, { PRODUCT_IMAGE } from "../types/product";
import { aggregationHelper, fieldValidateError } from "../helper";
import { MediaStoreService } from "../services/media.service";
import ProductSchema from "../models/product.model";
import { NotFound, InternalServerError, NotAcceptable } from "http-errors";
import { body } from "express-validator";
import mongoose from "mongoose";
import { UserSchema } from "../models";

class ProductController {
  async createProduct(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const productData: PRODUCT_TYPE = req.body;
      const Images: any = req?.files?.Images;
      fieldValidateError(req);
      let productImages: PRODUCT_IMAGE[] = [];
      if (Array.isArray(Images)) {
        await Promise.all(
          Images.map(async (Image) => {
            if (Image) {
              const ProductImage = (await new MediaStoreService().upload({
                files: Image,
                folder: "ProductImages",
              })) as {
                key: string;
                Location: string;
              };

              if (ProductImage) {
                productImages.push({
                  imagePath: ProductImage?.Location,
                  imageUrl: ProductImage?.key,
                });
              }
            }
          })
        );
      } else {
        const ProductImage = (await new MediaStoreService().upload({
          files: Images,
          folder: "ProductImages",
        })) as {
          key: string;
          Location: string;
        };

        if (ProductImage) {
          productImages.push({
            imagePath: ProductImage?.Location,
            imageUrl: ProductImage?.key,
          });
        }
      }

      const product = await ProductSchema.create({
        ...productData,
        productImages,
      });

      if (!product) throw new InternalServerError("Something went wrong!!");

      res.json({
        success: true,
        message: "Product created successfully...",
        data: product?.id,
      });
    } catch (error) {
      console.log({ error });
      next(error);
    }
  }
  async getAllProduct(req: Request, res: Response, next: NextFunction) {
    try {
      let {
        perPage,
        pageNo,
        productId,
        title,
        lessThanPrice,
        greaterThenPrice,
        cityName,
        placeName,
        bhk,
        category,
        listedBy,
        listedByIds,
        status,
        userId,
        isSoldOut,
        isSortOnCreateAndUpdate,
        isPriceOrder,
        isTitleOrder,
        searchTitle,
      }: any = req.query;

      let filterArgs: mongoose.PipelineStage[] = [];

      let reqUser;
      if (userId) {
        reqUser = await UserSchema.findById(userId);
      }

      // get product according to status
      const productStatus = ["PENDING", "DISABLE", "DELETED"];

      // global filter
      if (searchTitle) {
        filterArgs.push({
          $match: {
            $or: [
              {
                title: {
                  $regex: searchTitle,
                  $options: "i",
                },
              },
              {
                status: searchTitle,
              },
              {
                "locationData.cityName": {
                  $regex: searchTitle,
                  $options: "i",
                },
              },
              {
                "locationData.name": {
                  $regex: searchTitle,
                  $options: "i",
                },
              },
              {
                "bhkData.name": {
                  $regex: searchTitle,
                  $options: "i",
                },
              },
              {
                "categoryData.name": {
                  $regex: searchTitle,
                  $options: "i",
                },
              },
              {
                "listedByData.name": {
                  $regex: searchTitle,
                  $options: "i",
                },
              },
            ],
          },
        });
      }

      // filters
      if (isSoldOut) {
        isSoldOut = typeof isSoldOut === "string" ? true : undefined;
        filterArgs.push({
          $match: {
            isSoldOut: isSoldOut,
          },
        });
      }

      if (title) {
        filterArgs.push({
          $match: {
            title: {
              $regex: title,
              $options: "i",
            },
          },
        });
      }

      if (status) {
        filterArgs.push({
          $match: {
            status: status,
            isSoldOut: false,
          },
        });
      }

      if (productId && typeof productId === "string") {
        filterArgs.push({
          $match: {
            _id: new mongoose.Types.ObjectId(productId),
          },
        });
      }

      if (isSortOnCreateAndUpdate == "true") {
        filterArgs.push({
          $sort: { sortingScore: -1 },
        });
      }

      if (isSortOnCreateAndUpdate == "false") {
        filterArgs.push({
          $sort: { sortingScore: 1 },
        });
      }

      if (isPriceOrder === "true") {
        filterArgs.push({
          $sort: { price: -1 },
        });
      }

      if (isPriceOrder === "false") {
        filterArgs.push({
          $sort: { price: 1 },
        });
      }
      if (isTitleOrder === "true") {
        filterArgs.push({
          $sort: { title: -1 },
        });
      }
      if (isTitleOrder === "false") {
        filterArgs.push({
          $sort: { title: 1 },
        });
      }

      if (lessThanPrice) {
        filterArgs.push({
          $match: {
            price: {
              $lte: Number(lessThanPrice),
            },
          },
        });
      }

      if (greaterThenPrice) {
        filterArgs.push({
          $match: {
            price: {
              $gte: Number(greaterThenPrice),
            },
          },
        });
      }

      if (cityName) {
        filterArgs.push({
          $match: {
            "locationData.cityName": {
              $regex: cityName,
              $options: "i",
            },
          },
        });
      }

      if (placeName) {
        filterArgs.push({
          $match: {
            "locationData.name": {
              $regex: placeName,
              $options: "i",
            },
          },
        });
      }

      if (bhk) {
        filterArgs.push({
          $match: {
            "bhkData.name": {
              $regex: bhk,
              $options: "i",
            },
          },
        });
      }

      if (category) {
        filterArgs.push({
          $match: {
            "categoryData.name": {
              $regex: category,
              $options: "i",
            },
          },
        });
      }

      if (listedBy) {
        filterArgs.push({
          $match: {
            "listedByData.name": {
              $regex: listedBy,
              $options: "i",
            },
          },
        });
      }

      if (listedByIds) {
        const listedByObjectIds = listedByIds.map(
          (id: any) => new mongoose.Types.ObjectId(id)
        );
        filterArgs.push({
          $match: {
            "listedByData._id": {
              $in: listedByObjectIds,
            },
          },
        });
      }

      const rolesArr = ["ADMIN", "EMPLOYEE"];
      // main args
      const mainArgs: mongoose.PipelineStage[] = [
        {
          $lookup: {
            from: "users",
            localField: "listedBy",
            foreignField: "_id",
            as: "listedByData",
          },
        },
        {
          $unwind: {
            path: "$listedByData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            ownerName: 1,
            totalFloor: 1,
            floorNumber: 1,
            status: 1,
            ownerMobileNumber:
              reqUser && rolesArr.includes(reqUser?.role) ? 1 : null,
            ownerWhatsAppNumber:
              reqUser && rolesArr.includes(reqUser?.role) ? 1 : null,
            price: 1,
            productImages: 1,
            ProductSoldOutInfo: {
              $arrayElemAt: ["$ProductSoldOutInfo", 0],
            },

            listedByData: {
              _id: 1,
              name: 1,
              email: 1,
              role: 1,
              phone: 1,
              profileUrl: 1,
              slugName: 1,
            },
            viewedByData: 1,
            viewedBy: 1,
            tenantsData: 1,
            createdAt: 1,
            updatedAt: 1,
            isSoldOut: 1,
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
        {
          $addFields: {
            // Calculate a sorting score based on updatedAt and createdAt
            sortingScore: {
              $cond: {
                if: { $gte: ["$updatedAt", "$createdAt"] },
                then: "$updatedAt",
                else: "$createdAt",
              },
            },
          },
        },
      ];

      const args = [...mainArgs, ...filterArgs];

      const { data, pagination } = await aggregationHelper({
        model: ProductSchema,
        perPage: perPage ? Number(perPage) : undefined,
        pageNo: pageNo ? Number(pageNo) : undefined,
        args,
      });

      res.json({
        success: true,
        message: "Getting all product successfully...",
        data,
        pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ProductControllerValidator = {
  createProduct: [
    body("title")
      .notEmpty()
      .withMessage("title is required")
      .isString()
      .withMessage("title must be a string"),
    body("description")
      .optional()
      .isString()
      .withMessage("description must be a string"),
    body("ownerName")
      .notEmpty()
      .withMessage("ownerName is required")
      .isString()
      .withMessage("ownerName must be a string"),
    body("ownerMobileNumber")
      .optional()
      .bail()
      .isMobilePhone("any")
      .withMessage("Invalid phone number"),
    body("totalFloor")
      .optional()
      .isNumeric()
      .withMessage("totalFloor must be a number"),
    body("floorNumber")
      .optional()
      .isNumeric()
      .withMessage("floorNumber must be a number"),
    body("price").notEmpty().withMessage("price is required"),
    body("listedBy")
      .optional()
      .isMongoId()
      .withMessage("listedBy is must be a mongo id"),
  ],
};

export default ProductController;
