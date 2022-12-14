import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, Task as TaskEntity } from './task.entity';
import { Repository } from 'typeorm';
import { User } from 'src/auth/user.entity';
import { GetUser } from 'src/auth/get-user.decorator';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private taskRepository: Repository<TaskEntity>,
  ) {}

  async getTask(
    getTaskTilterDto: GetTaskFilterDto,
    user: User,
  ): Promise<Task[]> {
    const { status, search } = getTaskTilterDto;

    const query = this.taskRepository.createQueryBuilder('task');
    query.where({ user });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const tasks = await query.getMany();
    return tasks;
  }

  async createTask(
    createTaskDto: CreateTaskDto,
    user: User,
  ): Promise<TaskEntity> {
    const { title, description } = createTaskDto;
    const task = this.taskRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user,
    });
    await this.taskRepository.save(task);
    return task;
  }

  async getTaskById(id: string, user): Promise<TaskEntity> {
    const Task = await this.taskRepository.findOne({
      where: {
        id: id,
        user,
      },
    });
    if (!Task) {
      throw new NotFoundException(`Task with Id -> ${id} does not exist `);
    }
    return Task;
  }

  async deleteTaskById(id: string, user: User): Promise<string> {
    const taskToBeDeleted = await this.getTaskById(id, user);
    const task = await this.taskRepository.delete(taskToBeDeleted);

    if (task.affected === 0) {
      throw new NotFoundException(`Task with Id -> ${id} does not exist `);
    }
    return `Task with Id -> ${id} deleted successfully`;
  }

  async updateTaskById(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<TaskEntity> {
    const task = await this.getTaskById(id, user);
    task.status = status;
    await this.taskRepository.save(task);
    return task;
  }
}
