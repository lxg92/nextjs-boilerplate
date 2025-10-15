import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '../../lib/redis';
import { queryItems, putItem, updateItem, deleteItem } from '../../lib/dynamodb';
import { TABLES } from '../../lib/dynamodb';
import { uploadToS3, generateS3Key, getSignedDownloadUrl } from '../../lib/s3';
import { v4 as uuidv4 } from 'uuid';

export const GET = async (req: NextRequest) => {
  try {
    const sessionId = req.cookies.get('sessionId')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const favoritesOnly = url.searchParams.get('favoritesOnly') === 'true';

    const queryParams: any = {
      TableName: TABLES.RECORDINGS,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': sessionData.userId,
      },
      ScanIndexForward: false, // Sort by createdAt descending
      Limit: limit,
    };

    if (favoritesOnly) {
      queryParams.FilterExpression = 'isFavorite = :favorite';
      queryParams.ExpressionAttributeValues[':favorite'] = true;
    }

    if (page > 1) {
      // For pagination, you'd need to implement LastEvaluatedKey logic
      // This is simplified for now
    }

    const result = await queryItems(
      TABLES.RECORDINGS,
      queryParams.KeyConditionExpression,
      queryParams.ExpressionAttributeValues
    );

    // Generate signed URLs for audio files
    const recordings = await Promise.all(
      (result.Items || []).map(async (recording) => {
        const audioUrl = await getSignedDownloadUrl(recording.s3Key);
        return {
          ...recording,
          audioUrl,
        };
      })
    );

    return NextResponse.json({
      recordings,
      hasMore: result.LastEvaluatedKey ? true : false,
    });
  } catch (error) {
    console.error('Get recordings error:', error);
    return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
  }
};

export const POST = async (req: NextRequest) => {
  try {
    const sessionId = req.cookies.get('sessionId')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const sessionData = await getSession(sessionId);
    
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const formData = await req.formData();
    const audioBlob = formData.get('audioBlob') as File;
    const voiceId = formData.get('voiceId') as string;
    const voiceName = formData.get('voiceName') as string;
    const text = formData.get('text') as string;
    const speed = parseFloat(formData.get('speed') as string);
    const audioConfig = formData.get('audioConfig') ? JSON.parse(formData.get('audioConfig') as string) : {};
    const presetUsed = formData.get('presetUsed') as string;

    if (!audioBlob || !voiceId || !voiceName || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const recordingId = uuidv4();
    const s3Key = generateS3Key(sessionData.userId, recordingId);

    // Upload audio to S3
    const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());
    await uploadToS3(s3Key, audioBuffer, 'audio/mpeg');

    // Save recording metadata to DynamoDB
    const recording = {
      userId: sessionData.userId,
      recordingId,
      voiceId,
      voiceName,
      text,
      speed,
      s3Key,
      isFavorite: false,
      createdAt: Date.now(),
      audioConfig,
      presetUsed,
    };

    await putItem(TABLES.RECORDINGS, recording);

    // Generate signed URL for immediate playback
    const audioUrl = await getSignedDownloadUrl(s3Key);

    return NextResponse.json({
      recordingId,
      audioUrl,
      recording: {
        ...recording,
        audioUrl,
      },
    });
  } catch (error) {
    console.error('Save recording error:', error);
    return NextResponse.json({ error: 'Failed to save recording' }, { status: 500 });
  }
};


