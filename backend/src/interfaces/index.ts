import mongoose from "mongoose";

export interface UploadFileToGoogleDriveInput{
    mimeType: string;
    fileName: string;
    parentFolderId?: string;
}

export interface CreateCalendarEventInput{
    eventTitle: string;
    startTime: string;
    endTime: string;
    calendarId: string;
}

export interface SendAnnouncementToGoogleClassroomInput{
    courseId: string;
    text: string;
}

export interface User {
    email: string;
    name: string;
    googleId: string;
}

export interface Credentials {
    userId: mongoose.Types.ObjectId;
    provider: string;
    credentials: any;
}

export interface Integration {
    userId: mongoose.Types.ObjectId;
    sourceProvider: string;
    targetProvider: string;
    metadata: any;
    type: string;
}

export interface SetTokenForUserInput {
    creds: any;
    user: any;
    provider: string;
}

export interface CreateIntegrationInput {
    user: any;
    sourceProvider: string;
    targetProvider: string;
    metadata: any;
    type: string;
}

export interface RemoveIntegrationInput {
    integrationId: string;
}