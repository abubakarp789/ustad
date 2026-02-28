export interface LabStep {
    instruction: string;
    command?: string;
    note?: string;
}

export interface LabTask {
    id: string;
    title: string;
    description: string;
    steps: LabStep[];
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
