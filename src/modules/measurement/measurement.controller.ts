import { NextFunction, Request, Response } from 'express';

import {
  createMeasurement,
  deleteMeasurement,
  getMeasurement,
  listMeasurements,
  updateMeasurement,
} from './measurement.service';

import type { MeasurementCreateDTO, MeasurementListQuery } from './measurement.types';

export const createMeasurementController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const dto = req.body as MeasurementCreateDTO;
    const result = await createMeasurement(dto);
    res.locals.response = {
      status: true,
      code: 201,
      message: 'Measurement created successfully',
      data: result,
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const listMeasurementsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.query as unknown as MeasurementListQuery;
    const result = await listMeasurements(query);
    res.locals.response = {
      status: true,
      code: 200,
      data: result.items,
    };
    next();
  } catch (err) {
    next(err);
  }
};

export const getMeasurementController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { measurementId } = req.query as unknown as { measurementId: string };
    const result = await getMeasurement(measurementId);
    if (!result) {
      res.locals.response = {
        status: false,
        code: 404,
        message: 'Measurement not found',
      };
    } else {
      res.locals.response = {
        status: true,
        code: 200,
        data: result,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const updateMeasurementController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { measurementId, ...dto } = req.body;
    const result = await updateMeasurement(measurementId, dto);
    if (!result) {
      res.locals.response = {
        status: false,
        code: 404,
        message: 'Measurement not found',
      };
    } else {
      res.locals.response = {
        status: true,
        code: 200,
        message: 'Measurement updated successfully',
        data: result,
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const deleteMeasurementController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { measurementId } = req.query as unknown as { measurementId: string };
    const result = await deleteMeasurement(measurementId);
    if (!result) {
      res.locals.response = {
        status: false,
        code: 404,
        message: 'Measurement not found',
      };
    } else {
      res.locals.response = {
        status: true,
        code: 200,
        message: 'Measurement deleted successfully',
      };
    }
    next();
  } catch (err) {
    next(err);
  }
};
