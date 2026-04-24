import Joi from "joi";

const minDependentBirthDate = new Date();
minDependentBirthDate.setFullYear(minDependentBirthDate.getFullYear() - 22);
minDependentBirthDate.setHours(23, 59, 59, 999);

const insurancePlanTypeSchema = Joi.string()
  .uppercase()
  .valid("BASIC", "STANDARD", "PREMIUM")
  .messages({
    "any.only": "validation.insurance.type.invalid",
  });

const dependentRelationSchema = Joi.string()
  .uppercase()
  .valid("SPOUSE", "CHILD", "PARENT")
  .messages({
    "any.only": "validation.insurance.relation.invalid",
  });

export const createInsurancePlanSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required().messages({
    "string.empty": "validation.insurance.name.required",
    "any.required": "validation.insurance.name.required",
    "string.min": "validation.insurance.name.min",
    "string.max": "validation.insurance.name.max",
  }),
  type: insurancePlanTypeSchema.required().messages({
    "any.required": "validation.insurance.type.required",
    "string.empty": "validation.insurance.type.required",
  }),
  coverageDetails: Joi.string()
    .trim()
    .max(2000)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": "validation.insurance.coverageDetails.max",
    }),
  salaryPercentage: Joi.number().greater(0).max(1).required().messages({
    "number.base": "validation.insurance.salaryPercentage.invalid",
    "number.greater": "validation.insurance.salaryPercentage.min",
    "number.max": "validation.insurance.salaryPercentage.max",
    "any.required": "validation.insurance.salaryPercentage.required",
  }),
  maxDependents: Joi.number().integer().min(1).optional().messages({
    "number.base": "validation.insurance.maxDependents.invalid",
    "number.integer": "validation.insurance.maxDependents.invalid",
    "number.min": "validation.insurance.maxDependents.min",
  }),
})
  .min(1)
  .messages({
    "object.min": "validation.body.empty",
  });

export const updateInsurancePlanSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional().messages({
    "string.min": "validation.insurance.name.min",
    "string.max": "validation.insurance.name.max",
  }),
  type: insurancePlanTypeSchema.optional(),
  coverageDetails: Joi.string()
    .trim()
    .max(2000)
    .allow(null, "")
    .optional()
    .messages({
      "string.max": "validation.insurance.coverageDetails.max",
    }),
  salaryPercentage: Joi.number().greater(0).max(1).optional().messages({
    "number.base": "validation.insurance.salaryPercentage.invalid",
    "number.greater": "validation.insurance.salaryPercentage.min",
    "number.max": "validation.insurance.salaryPercentage.max",
  }),
  maxDependents: Joi.number().integer().min(1).optional().messages({
    "number.base": "validation.insurance.maxDependents.invalid",
    "number.integer": "validation.insurance.maxDependents.invalid",
    "number.min": "validation.insurance.maxDependents.min",
  }),
})
  .min(1)
  .messages({
    "object.min": "validation.body.empty",
  });

export const createInsuranceEnrollmentSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    "string.guid": "validation.insurance.userId.invalid",
    "string.empty": "validation.insurance.userId.required",
    "any.required": "validation.insurance.userId.required",
  }),
  startDate: Joi.date().iso().required().messages({
    "date.base": "validation.insurance.startDate.invalid",
    "date.format": "validation.insurance.startDate.invalid",
    "string.empty": "validation.insurance.startDate.required",
    "any.required": "validation.insurance.startDate.required",
  }),
  endDate: Joi.date()
    .iso()
    .when("startDate", {
      is: Joi.exist(),
      then: Joi.date().min(Joi.ref("startDate")),
    })
    .allow(null)
    .optional()
    .messages({
      "date.base": "validation.insurance.endDate.invalid",
      "date.format": "validation.insurance.endDate.invalid",
      "date.min": "validation.insurance.endDate.beforeStart",
    }),
})
  .min(2)
  .messages({
    "object.min": "validation.body.empty",
  });

export const createInsuranceDependentSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).required().messages({
    "string.empty": "validation.insurance.dependent.name.required",
    "any.required": "validation.insurance.dependent.name.required",
    "string.min": "validation.insurance.dependent.name.required",
    "string.max": "validation.insurance.dependent.name.max",
  }),
  relation: dependentRelationSchema.required().messages({
    "any.required": "validation.insurance.relation.required",
    "string.empty": "validation.insurance.relation.required",
  }),
  dateOfBirth: Joi.date()
    .iso()
    .less("now")
    .messages({
      "date.less": "validation.insurance.dateOfBirth.future",
    })
    .max(minDependentBirthDate)
    .messages({
      "date.max": "validation.insurance.dateOfBirth.minAge",
    })
    .required()
    .messages({
      "date.base": "validation.insurance.dateOfBirth.invalid",
      "date.format": "validation.insurance.dateOfBirth.invalid",
      "any.required": "validation.insurance.dateOfBirth.required",
    }),
  nationalId: Joi.string().trim().max(14).allow(null, "").optional().messages({
    "string.max": "validation.insurance.nationalId.max",
  }),
})
  .min(1)
  .messages({
    "object.min": "validation.body.empty",
  });
