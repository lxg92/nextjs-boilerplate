# Echofy - Voice Cloning & Text-to-Speech Application

A modern, full-featured voice cloning and text-to-speech application built with Next.js, React, and TypeScript. Create custom voices, generate high-quality speech, and manage your recordings with advanced audio processing capabilities.

## 🚀 Features

### Core Functionality
- **Voice Cloning**: Upload audio samples to create custom voices using ElevenLabs Instant Voice Cloning (IVC)
- **Text-to-Speech Generation**: Generate natural-sounding speech from text with customizable speed
- **Voice Management**: Upload, select, and delete custom voices
- **Recording Persistence**: Save and manage your generated audio recordings locally
- **Advanced Audio Processing**: Real-time audio effects including:
  - Reverb with adjustable room size and wet/dry mix
  - Delay with configurable timing and feedback
  - Frequency modulation
  - Noise generation (white, pink, brown)
  - Isochronic tones for binaural effects
  - Stereo panning and volume control

### User Experience
- **Multi-Route Navigation**: Seamless navigation between Upload, Generate, and Recordings views
- **Responsive Design**: Fully responsive UI with dark mode support
- **Audio Presets**: Pre-configured audio presets for quick setup
- **Custom Presets**: Save and load your own audio configurations
- **Subscription Tiers**: Feature-gated access based on subscription level (FREE, BASIC, PREMIUM)
- **Authentication**: Password-protected access with session management

### Developer Experience
- **Error Tracking**: Integrated Sentry for production error monitoring
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Modern React Patterns**: Custom hooks, context providers, and component composition
- **Performance Optimized**: React Query for efficient data fetching and caching

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.5.4](https://nextjs.org/) with App Router
- **UI Library**: [React 19.1.0](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Audio Processing**: [Tone.js 14.9.17](https://tonejs.github.io/)
- **Data Fetching**: [TanStack React Query 5.90.2](https://tanstack.com/query)
- **Error Monitoring**: [Sentry Next.js 10.26.0](https://sentry.io/for/nextjs/)
- **API Integration**: ElevenLabs API for voice cloning and TTS

## 📋 Prerequisites

- Node.js 18+ (or latest LTS version)
- npm, yarn, pnpm, or bun package manager
- ElevenLabs API key ([Get one here](https://elevenlabs.io/))

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd echofy-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   
   # Optional: Sentry Configuration
   SENTRY_ORG=your_sentry_org
   SENTRY_PROJECT=your_sentry_project
   SENTRY_AUTH_TOKEN=your_sentry_auth_token
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
echofy-app/
├── app/
│   ├── api/                    # API routes
│   │   ├── tts/               # Text-to-speech endpoint
│   │   ├── voices/            # Voice management endpoints
│   │   └── sentry-example-api/ # Sentry integration example
│   ├── components/            # React components
│   │   ├── AudioControls.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── AuthGuard.tsx
│   │   ├── Navigation.tsx
│   │   ├── PlaybackProgress.tsx
│   │   ├── PresetManager.tsx
│   │   ├── VoiceRecordingsRoute.tsx
│   │   ├── VoiceSelectionRoute.tsx
│   │   └── VoiceUploadRoute.tsx
│   ├── contexts/              # React contexts
│   │   └── TierEmulationContext.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAudioProcessing.ts
│   │   ├── useAuthentication.ts
│   │   ├── useCustomPresets.ts
│   │   ├── usePlaybackControl.ts
│   │   ├── useRecordingPersistence.ts
│   │   ├── useToneNodes.ts
│   │   ├── useTTSGeneration.ts
│   │   └── useVoiceManagement.ts
│   ├── lib/                   # Utility libraries
│   │   └── feature-flags.ts
│   ├── types/                 # TypeScript type definitions
│   │   ├── constants.ts
│   │   ├── index.ts
│   │   └── subscription.ts
│   ├── utils/                 # Utility functions
│   │   ├── audioNodeUpdaters.ts
│   │   ├── audioPresets.ts
│   │   └── audioUrlConverter.ts
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Main page component
│   └── providers.tsx          # Context providers
├── docs/                      # Documentation
├── public/                    # Static assets
├── instrumentation.ts         # Sentry instrumentation
├── instrumentation-client.ts  # Client-side Sentry setup
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## 🎯 Usage

### Authentication
The application uses a simple password-based authentication system. Enter the password when prompted to access the application.

### Creating a Voice
1. Navigate to the **Upload** tab
2. Upload an audio file (MP3, WAV, or other supported formats)
3. Enter a name for your voice
4. Click **Upload** to create your custom voice

### Generating Speech
1. Navigate to the **Generate** tab
2. Select a voice from your available voices
3. Enter the text you want to convert to speech
4. Adjust the speed slider (if needed)
5. Click **Generate** to create the audio
6. The generated audio will be automatically saved to your recordings

### Managing Recordings
1. Navigate to the **Recordings** tab
2. View all your saved recordings
3. Play, pause, or delete individual recordings
4. Use advanced audio controls to adjust playback effects

### Audio Controls
- **Volume**: Adjust master volume (0-200%)
- **Pan**: Control stereo positioning (-1 to 1)
- **Reverb**: Add spatial depth with room size and wet/dry controls
- **Delay**: Create echo effects with timing and feedback
- **Frequency**: Apply frequency modulation
- **Noise**: Add background noise (white, pink, or brown)
- **Isochronic**: Generate binaural beats for focus/relaxation

## 🔐 Subscription Tiers

The application supports three subscription tiers with different feature access:

### FREE Tier
- 1 recording per month
- 1 custom voice
- Default text only (no custom text input)
- Limited audio presets
- Standard support

### BASIC Tier
- 10 recordings per month
- 3 custom voices
- Up to 1,500 characters per generation
- All audio presets
- Priority generation
- Standard support

### PREMIUM Tier
- 50 recordings per month
- 5 custom voices
- Up to 5,000 characters per generation
- Advanced audio controls
- Custom presets
- All audio presets
- Priority generation
- Premium support

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle with Turbopack
- `npm run start` - Start production server

### Code Style Guidelines

- Use TypeScript for all new files
- Follow React best practices (hooks, functional components)
- Use Tailwind CSS for styling (avoid inline styles)
- Implement early returns for better readability
- Use descriptive variable and function names
- Event handlers should be prefixed with `handle` (e.g., `handleClick`)
- Use `const` arrow functions instead of `function` declarations
- Implement accessibility features (ARIA labels, keyboard navigation)

## 🚢 Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Environment Variables for Production

Ensure all required environment variables are set in your production environment:

- `ELEVENLABS_API_KEY` - Required for voice and TTS functionality
- `SENTRY_*` - Optional, for error tracking

### Deploy to Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The application is optimized for Vercel's platform with automatic serverless function deployment.

## 📝 API Endpoints

### `/api/voices`
- `GET` - Fetch all user-generated voices
- `POST` - Create a new voice (requires FormData with `file` and `name`)
- `DELETE` - Delete a voice (requires JSON body with `voiceId`)

### `/api/tts`
- `POST` - Generate text-to-speech audio (requires JSON body with `voiceId`, `text`, and optional `speed`)

## 🐛 Error Tracking

The application uses Sentry for error tracking and monitoring. Errors are automatically captured with context including:
- Feature tags (tts, voices, etc.)
- Operation types (get, post, delete)
- Error types (network, validation, etc.)
- Request metadata

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary. All rights reserved.

## 🙏 Acknowledgments

- [ElevenLabs](https://elevenlabs.io/) for voice cloning and TTS API
- [Tone.js](https://tonejs.github.io/) for audio processing
- [Next.js](https://nextjs.org/) team for the amazing framework
- [Sentry](https://sentry.io/) for error tracking

## 📞 Support

For issues, questions, or feature requests, please open an issue in the repository.

---

Built with ❤️ using Next.js, React, and TypeScript
