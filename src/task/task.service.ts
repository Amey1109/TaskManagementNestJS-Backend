import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskStatus } from './task-status.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTaskFilterDto } from './dto/get-task-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, Task as TaskEntity } from './task.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private taskRepository: Repository<TaskEntity>,
  ) {}

  async getTask(getTaskTilterDto: GetTaskFilterDto): Promise<Task[]> {
    const { status, search } = getTaskTilterDto;

    const query = this.taskRepository.createQueryBuilder('task');

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        'LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search)',
        { search: `%${search}%` },
      );
    }

    const tasks = await query.getMany();
    return tasks;
  }

  async createTask(createTaskDto: CreateTaskDto): Promise<TaskEntity> {
    const { title, description } = createTaskDto;
    const task = this.taskRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
    });
    await this.taskRepository.save(task);
    return task;
  }

  async getTaskById(id: string): Promise<TaskEntity> {
    const Task = await this.taskRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!Task) {
      throw new NotFoundException(`Task with Id -> ${id} does not exist `);
    }
    return Task;
  }

  async deleteTaskById(id: string): Promise<string> {
    const task = await this.taskRepository.delete(id);
    if (task.affected === 0) {
      throw new NotFoundException(`Task with Id -> ${id} does not exist `);
    }
    return `Task with Id -> ${id} deleted successfully`;
  }

  async updateTaskById(id: string, status: TaskStatus): Promise<TaskEntity> {
    const task = await this.getTaskById(id);
    task.status = status;
    await this.taskRepository.save(task);
    return task;
  }
}
