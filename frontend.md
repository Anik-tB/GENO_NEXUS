# Remaining Frontend Tasks

Based on the project analysis, the frontend pages and routing are mostly set up within the `src/app/dashboard` directory. However, to fully realize the 15 core features of the GenoNexus platform, the following frontend tasks remain:

## 1. API Integration & State Management
- **Connect UI to Backend APIs**: Replace mock data with actual API calls to the new Python/FastAPI and Node.js microservices for all 15 features. Currently, only auth and a partial upload API exist.
- **State Management**: Implement Redux Toolkit or Zustand for centralized state management. This is essential for handling large, complex genomic datasets across multiple components without excessive prop-drilling.
- **Error Handling & Loading States**: Add comprehensive skeleton loaders, progress bars (critical for long-running genomic analysis which can take minutes/hours), and graceful error handling/toasts for API failures.

## 2. Advanced Visualizations (Group C Features)
- **3D / VR Genome Browser**: Integrate Three.js or Babylon.js to render 3D chromosome navigation and variant exploration on the web.
- **Digital Cell Twin**: Implement WebGL-based visualization for cellular process simulations.
- **Phylogenetic Tree Builder**: Integrate D3.js or the ETE Toolkit to render interactive, animated evolutionary trees based on backend analysis.
- **Real-Time Virus Mutation Tracker**: Implement Leaflet.js or Mapbox maps with live WebSocket connections to show emerging variants globally in real-time.

## 3. Real-Time & Interactive Features
- **AI Gene Chatbot UI**: Implement a chat interface with streaming text responses (similar to ChatGPT) using Server-Sent Events (SSE) or WebSockets.
- **Drag & Drop Pipeline Builder**: Build the interactive workflow canvas using React Flow, allowing users to drag nodes (representing bioinformatic tools) and connect them to form a pipeline.
- **Collaboration Hub**: Add real-time cursors, live notifications, and file-editing presence using WebSockets/Socket.io.

## 4. Security & Data Infrastructure
- **Blockchain & ZKP Interface**: Add UI elements to display Zero-Knowledge Proof verification status and blockchain transaction hashes for data sovereignty.
- **Expanded Upload Capabilities**: Enhance the existing upload component to support chunked uploads for massive FASTA/VCF files with pause, resume, and retry functionality.
