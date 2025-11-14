import { UserRepository } from '../repositories';
import { ApiError } from '../utils';
import { UpdateUserProfileInput } from '../schemas';

export class UserService {
  private userRepository = new UserRepository();

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  async updateUserProfile(userId: string, data: UpdateUserProfileInput) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const updateData: Record<string, any> = {};
    if (data.displayName !== undefined)
      updateData['displayName'] = data.displayName;
    if (data.timezone !== undefined) updateData['timezone'] = data.timezone;
    if (data.settings !== undefined) updateData['settings'] = data.settings;

    const updated = await this.userRepository.update(userId, updateData as any);
    return updated;
  }

  async createUser(email: string, displayName: string) {
    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      throw ApiError.conflict('User with this email already exists');
    }

    const user = await this.userRepository.create({
      email,
      displayName,
      timezone: 'UTC',
    });

    return user;
  }
}
