import { Controller, Get, Post, Body, Sse, MessageEvent, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SyncService } from './sync.service';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Sse('stream')
  @ApiOperation({ summary: 'Server-Sent Events (SSE) stream for live real-time sync across all actors' })
  stream(): Observable<MessageEvent> {
    return this.syncService.getEventStream();
  }

  @Get('state')
  @ApiOperation({ summary: 'Get unified live state across all actors' })
  getState() {
    return {
      success: true,
      message: 'Unified sync state retrieved',
      data: this.syncService.getState(),
    };
  }

  @Get('events')
  @ApiOperation({ summary: 'Get recent sync events' })
  getEvents(@Query('limit') limit?: number) {
    return {
      success: true,
      data: this.syncService.getRecentEvents(limit ? Number(limit) : 30),
    };
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast an event to all connected actors' })
  broadcast(@Body() body: { type: string; payload: any }) {
    if (!body?.type) {
      return { success: false, message: 'Event type is required' };
    }
    const event = this.syncService.emit(body.type, body.payload || {});
    return {
      success: true,
      message: 'Event broadcasted',
      data: event,
    };
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Register/sync a new or updated bus schedule' })
  saveSchedule(@Body() body: any) {
    const saved = this.syncService.registerSchedule(body);
    return {
      success: true,
      message: 'Schedule synced and broadcasted',
      data: saved,
    };
  }

  @Post('booking')
  @ApiOperation({ summary: 'Register/sync a confirmed booking' })
  saveBooking(@Body() body: any) {
    const saved = this.syncService.registerBooking(body);
    return {
      success: true,
      message: 'Booking synced and broadcasted',
      data: saved,
    };
  }

  @Post('trip-status')
  @ApiOperation({ summary: 'Update and broadcast trip status (e.g. IN_PROGRESS)' })
  updateTripStatus(@Body() body: { tripId: string; status: string }) {
    if (!body?.tripId || !body?.status) {
      return { success: false, message: 'tripId and status are required' };
    }
    const result = this.syncService.setTripStatus(body.tripId, body.status);
    return {
      success: true,
      message: 'Trip status updated and broadcasted',
      data: result,
    };
  }
}
