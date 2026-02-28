export interface LabTask {
    id: string;
    title: string;
    description: string;
    script: string;
}

export interface LabData {
    labTitle: string;
    labDescription?: string;
    tasks: LabTask[];
}

export interface LabHistoryItem {
    id: string;
    title: string;
    url?: string;
    createdAt: string;
    data: LabData;
    completedSteps: string[];
}
