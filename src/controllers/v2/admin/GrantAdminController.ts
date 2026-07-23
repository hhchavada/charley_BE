import { Request, Response } from 'express';
import { BaseRepository } from '../../config/repositories/BaseRepository';
import { Grant, IGrant } from '../../../../models/v2/Grant';
import { GrantDTO } from '../../config/dto';

const grantRepo = new BaseRepository<IGrant, GrantDTO>(Grant, 'GRANT');

export class GrantAdminController {
  static async listGrants(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const sortField = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

      const result = await grantRepo.findPaginated(
        page, 
        limit, 
        search, 
        ['name', 'grantId', 'description'], 
        {}, 
        { [sortField]: sortOrder }
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getGrant(req: Request, res: Response) {
    try {
      const grant = await grantRepo.findById(req.params.id, 'grantId');
      if (!grant) return res.status(404).json({ error: 'Grant not found' });
      res.json(grant);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async createGrant(req: Request, res: Response) {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const grant = await grantRepo.create(req.body, adminId, 'grantId');
      res.status(201).json(grant);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateGrant(req: Request, res: Response) {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const grant = await grantRepo.update(req.params.id, req.body, adminId, 'grantId');
      if (!grant) return res.status(404).json({ error: 'Grant not found' });
      res.json(grant);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteGrant(req: Request, res: Response) {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const success = await grantRepo.softDelete(req.params.id, adminId, 'grantId');
      if (!success) return res.status(404).json({ error: 'Grant not found' });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async cloneGrant(req: Request, res: Response) {
    try {
      const adminId = req.headers['x-admin-id'] as string || 'system';
      const grant = await grantRepo.findById(req.params.id, 'grantId');
      if (!grant) return res.status(404).json({ error: 'Grant not found' });

      // Strip IDs and specific metadata
      const cloneData = {
        ...grant,
        grantId: `${grant.grantId}_clone_${Date.now()}`,
        name: `${grant.name} (Clone)`,
        status: 'DRAFT' as any
      };
      delete cloneData._id;
      delete cloneData.createdAt;
      delete cloneData.updatedAt;

      const newGrant = await grantRepo.create(cloneData, adminId, 'grantId');
      res.status(201).json(newGrant);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
