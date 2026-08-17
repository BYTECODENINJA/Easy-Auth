import { eq } from 'drizzle-orm';
import { NewUser, users } from '../db/schema';
import { db } from '../db';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }
  async findById(id: string) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async findByVerificationToken(token: string) {
    try {
      console.log('DB: Looking up verification token...');
      const result = await db.query.users.findFirst({
        where: eq(users.verificationToken, token),
      });
      console.log('DB: Token lookup result:', result ? 'found' : 'not found');
      return result;
    } catch (error) {
      console.error('DB: Token lookup error:', error);
      throw error;
    }
  }

  async findByResetToken(token: string) {
    return db.query.users.findFirst({
      where: eq(users.resetToken, token),
    });
  }

  async create(data: NewUser) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async update(id: string, data: Partial<typeof users.$inferInsert>) {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    return user;
  }

  async findAll() {
    return db.query.users.findMany();
  }

  async delete(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }
}
