import { Router } from "express";
import ProductController, {
  ProductControllerValidator,
} from "../controllers/product.controller";
import ProtectedMiddleware from "../middlewares/protected.middleware";

export default class ProductRoutes {
  public router: Router;
  private productController: ProductController;
  public path = "products";
  constructor() {
    this.router = Router();
    this.productController = new ProductController();
    this.routes();
  }

  private routes() {
    this.router.post(
      "/",
      ProductControllerValidator.createProduct,
      new ProtectedMiddleware().isEmployeeOrAdmin,
      this.productController.createProduct
    );
    this.router.get(
      "/",
      new ProtectedMiddleware().isEmployeeOrAdmin,
      this.productController.getAllProduct
    );
  }
}
