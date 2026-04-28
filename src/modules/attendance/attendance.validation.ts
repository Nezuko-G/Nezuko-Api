import Joi from "joi";

export const markAttendanceSchema = Joi.object({
  lat: Joi.number().optional().messages({
    "number.base": "validation.attendance.lat.invalid",
  }),
  lng: Joi.number().optional().messages({
    "number.base": "validation.attendance.lng.invalid",
  }),
});
