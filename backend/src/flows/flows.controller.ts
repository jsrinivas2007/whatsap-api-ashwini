import { Controller, Get, Post, Patch, Delete, Body, Param, Headers } from '@nestjs/common';
import { FlowsService } from './flows.service.js';
import { FlowEngineService } from './flow-engine.service.js';

@Controller('api/flows')
export class FlowsController {
  constructor(
    private readonly flowsService: FlowsService,
    private readonly flowEngine: FlowEngineService,
  ) {}

  private getAccountId(headers: any): string {
    return headers['x-account-id'] || '00000000-0000-0000-0000-000000000000';
  }

  // --- Flows ---

  @Get()
  async listFlows(@Headers() headers: any) {
    return this.flowsService.listFlows(this.getAccountId(headers));
  }

  @Post()
  async createFlow(@Headers() headers: any, @Body() payload: any) {
    return this.flowsService.createFlow(this.getAccountId(headers), payload?.name);
  }

  @Get(':id')
  async getFlow(@Headers() headers: any, @Param('id') id: string) {
    return this.flowsService.getFlow(this.getAccountId(headers), id);
  }

  @Patch(':id')
  async updateFlow(@Headers() headers: any, @Param('id') id: string, @Body() payload: any) {
    return this.flowsService.updateFlow(this.getAccountId(headers), id, payload);
  }

  @Delete(':id')
  async deleteFlow(@Headers() headers: any, @Param('id') id: string) {
    return this.flowsService.deleteFlow(this.getAccountId(headers), id);
  }

  @Patch(':id/status')
  async updateStatus(@Headers() headers: any, @Param('id') id: string, @Body() payload: any) {
    return this.flowsService.updateStatus(this.getAccountId(headers), id, payload?.status);
  }

  @Post(':id/duplicate')
  async duplicateFlow(@Headers() headers: any, @Param('id') id: string) {
    return this.flowsService.duplicateFlow(this.getAccountId(headers), id);
  }

  @Post(':id/publish')
  async publishFlow(@Headers() headers: any, @Param('id') id: string, @Body() payload: any) {
    return this.flowEngine.publishFlow(this.getAccountId(headers), id, !!payload?.force);
  }

  @Post(':id/test')
  async testFlow(@Headers() headers: any, @Param('id') id: string, @Body() payload: any) {
    return this.flowEngine.testFlow(this.getAccountId(headers), id, payload || {});
  }

  // --- Nodes ---

  @Get(':id/nodes')
  async listNodes(@Headers() headers: any, @Param('id') id: string) {
    return this.flowsService.listNodes(this.getAccountId(headers), id);
  }

  @Post(':id/nodes')
  async createNode(@Headers() headers: any, @Param('id') id: string, @Body() payload: any) {
    return this.flowsService.createNode(this.getAccountId(headers), id, payload);
  }

  @Patch(':id/nodes/:nodeId')
  async updateNode(
    @Headers() headers: any,
    @Param('id') id: string,
    @Param('nodeId') nodeId: string,
    @Body() payload: any,
  ) {
    return this.flowsService.updateNode(this.getAccountId(headers), id, nodeId, payload);
  }

  @Delete(':id/nodes/:nodeId')
  async deleteNode(@Headers() headers: any, @Param('id') id: string, @Param('nodeId') nodeId: string) {
    return this.flowsService.deleteNode(this.getAccountId(headers), id, nodeId);
  }

  // --- Edges ---

  @Get(':id/edges')
  async listEdges(@Headers() headers: any, @Param('id') id: string) {
    return this.flowsService.listEdges(this.getAccountId(headers), id);
  }

  @Post(':id/edges')
  async createEdge(@Headers() headers: any, @Param('id') id: string, @Body() payload: any) {
    return this.flowsService.createEdge(this.getAccountId(headers), id, payload);
  }

  @Delete(':id/edges/:edgeId')
  async deleteEdge(@Headers() headers: any, @Param('id') id: string, @Param('edgeId') edgeId: string) {
    return this.flowsService.deleteEdge(this.getAccountId(headers), id, edgeId);
  }
}
