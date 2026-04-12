import { Router } from "express";
import { AuthRouter } from "../auth";
import { CategoryRouter } from "../Category";
import { AuthorRouter } from "../author";
import { PlanRouter } from "../plan";
import { BookRouter } from "../book";
import { SubscriptionRouter } from "../subscription";
import { UserBookRouter } from "../user-book";


const router = Router();

router.use("/auth", AuthRouter);
router.use("/categories", CategoryRouter);
router.use("/authors", AuthorRouter);
router.use("/plans", PlanRouter);
router.use("/books", BookRouter);
router.use("/subscriptions", SubscriptionRouter);
router.use("/user-books", UserBookRouter);



export { router as GlobalRouter };
