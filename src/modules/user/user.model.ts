import bcrypt from 'bcryptjs';
import { Schema, model, type Model, Types } from 'mongoose';

import { ROLES } from '@shared/constants';

export interface User {
  name: string;
  username: string;
  email?: string;
  password: string;
  role: string;
  brandId?: Types.ObjectId;
  outlets?: Types.ObjectId[];
  permissions?: string[];
  isActive: boolean;
  salary?: number;
  isDelete: boolean;
}

export interface UserMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserModel = Model<User, Record<string, never>, UserMethods>;

const UserSchema = new Schema<User, UserModel, UserMethods>(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, required: true, enum: Object.values(ROLES) },
    brandId: { type: Schema.Types.ObjectId, index: true, ref: 'Brand' },
    outlets: [{ type: Schema.Types.ObjectId, ref: 'Outlet' }],
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    salary: { type: Number },
    isDelete: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete (ret as { password?: unknown }).password;
        delete (ret as { isDelete?: unknown }).isDelete;
        return ret;
      },
    },
  },
);

UserSchema.index({ username: 1 }, { unique: true, partialFilterExpression: { isDelete: false } });

UserSchema.pre('save', async function (next) {
  if (this.isModified('username')) {
    this.username = (this.username || '').trim().toLowerCase();
  }
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const UserEntity = model<User, UserModel>('User', UserSchema);
export default UserEntity;
