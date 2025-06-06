export const createMockPerformanceClient = () => ({
  recordStartEvent: jest.fn(),
  recordSuccessEvent: jest.fn(),
  recordConnectionPauseEvent: jest.fn(),
  recordConnectionResumeEvent: jest.fn(),
});
