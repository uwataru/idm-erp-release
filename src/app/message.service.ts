import { Injectable } from '@angular/core';

@Injectable()
export class MessageService {
    messages: string[] = [];

    add(message: string) {
        this.messages.push(message);
        setTimeout (() => {
            this.clear()
        }, 3000);
    }

    clear() {
        this.messages = [];
    }
}
