import { Router } from "express";
import { assetController } from "./asset.controller";
import { requireAuth } from "@/shared/middleware/auth.middleware";
import { checkRole } from "@/shared/middleware/checkRole.middleware";

const router = Router();

router.use(requireAuth);

router.get("/me", assetController.getMyAssets);
router.get("/report/depreciation", checkRole(["TENANT_OWNER", "HR_ADMIN"]), assetController.getDepreciationReport);
router.get("/users/:userId", checkRole(["TENANT_OWNER", "HR_ADMIN", "MANAGER"]), assetController.getEmployeeAssets);
router.get("/:id/history", checkRole(["TENANT_OWNER", "HR_ADMIN"]), assetController.getHistory);
router.get("/:id", checkRole(["TENANT_OWNER", "HR_ADMIN"]), assetController.getOne);
router.get("/", checkRole(["TENANT_OWNER", "HR_ADMIN"]), assetController.getAll);

router.post("/", checkRole(["TENANT_OWNER", "HR_ADMIN"]), assetController.create);
router.patch("/:id", checkRole(["TENANT_OWNER", "HR_ADMIN"]), assetController.update);

router.post("/:id/assign", checkRole(["TENANT_OWNER", "HR_ADMIN"]), assetController.assign);
router.post("/:id/return", checkRole(["TENANT_OWNER", "HR_ADMIN"]), assetController.returnAsset);
router.post("/:id/transfer", checkRole(["TENANT_OWNER", "HR_ADMIN"]), assetController.transfer);
router.post("/:id/retire", checkRole(["TENANT_OWNER", "HR_ADMIN"]), assetController.retire);

export { router as AssetRouter };