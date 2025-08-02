export declare class SchedulerService {
    private bookingService;
    private tasks;
    constructor();
    start(): void;
    stop(): void;
    triggerBookingProcessing(): Promise<void>;
    getTaskStatus(): {
        [key: string]: boolean;
    };
}
//# sourceMappingURL=SchedulerService.d.ts.map