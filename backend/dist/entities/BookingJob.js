"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookedSlot = exports.BookingJob = exports.RecurrenceFrequency = exports.BookingStatus = exports.BookingType = void 0;
const typeorm_1 = require("typeorm");
var BookingType;
(function (BookingType) {
    BookingType["ONE_TIME"] = "one_time";
    BookingType["RECURRING"] = "recurring";
})(BookingType || (exports.BookingType = BookingType = {}));
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["ACTIVE"] = "active";
    BookingStatus["PAUSED"] = "paused";
    BookingStatus["COMPLETED"] = "completed";
    BookingStatus["FAILED"] = "failed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var RecurrenceFrequency;
(function (RecurrenceFrequency) {
    RecurrenceFrequency["DAILY"] = "daily";
    RecurrenceFrequency["WEEKLY"] = "weekly";
    RecurrenceFrequency["MONTHLY"] = "monthly";
    RecurrenceFrequency["ALWAYS"] = "always";
})(RecurrenceFrequency || (exports.RecurrenceFrequency = RecurrenceFrequency = {}));
let BookingJob = class BookingJob {
};
exports.BookingJob = BookingJob;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BookingJob.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BookingJob.prototype, "userEmail", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BookingJob.prototype, "userLastName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BookingJob.prototype, "userUnitNumber", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BookingJob.prototype, "amenityId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BookingJob.prototype, "amenityName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'simple-enum',
        enum: BookingType
    }),
    __metadata("design:type", String)
], BookingJob.prototype, "bookingType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'simple-enum',
        enum: BookingStatus,
        default: BookingStatus.ACTIVE
    }),
    __metadata("design:type", String)
], BookingJob.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], BookingJob.prototype, "targetDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingJob.prototype, "targetTime", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'simple-enum',
        enum: RecurrenceFrequency,
        nullable: true
    }),
    __metadata("design:type", String)
], BookingJob.prototype, "recurrenceFrequency", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], BookingJob.prototype, "preferredTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], BookingJob.prototype, "preferredDaysOfWeek", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], BookingJob.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 1 }),
    __metadata("design:type", Number)
], BookingJob.prototype, "partySize", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], BookingJob.prototype, "successfulBookings", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], BookingJob.prototype, "failedAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], BookingJob.prototype, "lastAttempt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], BookingJob.prototype, "lastSuccessfulBooking", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], BookingJob.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], BookingJob.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => BookedSlot, (slot) => slot.bookingJob, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], BookingJob.prototype, "bookedSlots", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BookingJob.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], BookingJob.prototype, "updatedAt", void 0);
exports.BookingJob = BookingJob = __decorate([
    (0, typeorm_1.Entity)()
], BookingJob);
let BookedSlot = class BookedSlot {
};
exports.BookedSlot = BookedSlot;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BookedSlot.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => BookingJob, (job) => job.bookedSlots),
    __metadata("design:type", BookingJob)
], BookedSlot.prototype, "bookingJob", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BookedSlot.prototype, "reservationId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BookedSlot.prototype, "accessCode", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BookedSlot.prototype, "bookedDate", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], BookedSlot.prototype, "bookedTime", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], BookedSlot.prototype, "createdAt", void 0);
exports.BookedSlot = BookedSlot = __decorate([
    (0, typeorm_1.Entity)()
], BookedSlot);
//# sourceMappingURL=BookingJob.js.map