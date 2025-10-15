import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../lib/redis';
import { getItem, updateItem, deleteItem } from '../../lib/dynamodb';
import { TABLES } from '../../lib/dynamodb';
import { deleteFromS3, getSignedDownloadUrl } from '../../lib/s3';

export const GET = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const sessionId = req.cookies.get('sessionId')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const recordingId = params.id;
    const result = await getItem(TABLES.RECORDINGS, {
      userId: sessionData.userId,
      recordingId,
    });

    if (!result.Item) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    const recording = result.Item;
    const audioUrl = await getSignedDownloadUrl(recording.s3Key);

    return NextResponse.json({
      ...recording,
      audioUrl,
    });
  } catch (error) {
    console.error('Get recording error:', error);
    return NextResponse.json({ error: 'Failed to fetch recording' }, { status: 500 });
  }
};

export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const sessionId = req.cookies.get('sessionId')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const recordingId = params.id;
    const { isFavorite } = await req.json();

    // Update favorite status
    await updateItem(
      TABLES.RECORDINGS,
      { userId: sessionData.userId, recordingId },
      'SET isFavorite = :favorite',
      { ':favorite': isFavorite }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update recording error:', error);
    return NextResponse.json({ error: 'Failed to update recording' }, { status: 500 });
  }
};

export const DELETE = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const sessionId = req.cookies.get('sessionId')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const recordingId = params.id;

    // Get recording to find S3 key
    const result = await getItem(TABLES.RECORDINGS, {
      userId: sessionData.userId,
      recordingId,
    });

    if (!result.Item) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    }

    const recording = result.Item;

    // Delete from S3
    await deleteFromS3(recording.s3Key);

    // Delete from DynamoDB
    await deleteItem(TABLES.RECORDINGS, {
      userId: sessionData.userId,
      recordingId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete recording error:', error);
    return NextResponse.json({ error: 'Failed to delete recording' }, { status: 500 });
  }
};


