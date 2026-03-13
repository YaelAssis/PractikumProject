import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generic-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-list.component.html',
  styleUrls: ['./generic-list.component.css']
})
export class GenericListComponent {
  @Input() title: string = '';
  @Input() items: any[] = [];
  @Input() columns: { key: string, label: string }[] = [];

  @Output() rowClick = new EventEmitter<any>();
  @Output() viewClick = new EventEmitter<any>();
  @Output() editClick = new EventEmitter<any>();

  selectRow(item: any) {
    this.rowClick.emit(item);
  }

  onView(item: any, event: Event) {
    event.stopPropagation();
    this.viewClick.emit(item);
  }

  onEdit(item: any, event: Event) {
    event.stopPropagation();
    this.editClick.emit(item);
  }
}