import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-generic-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generic-form.component.html',
  styleUrl: './generic-form.component.css'
})
export class GenericFormComponent implements OnChanges {

  @Input() title: string = '';
  @Input() fields: any[] = [];
  @Input() data: any = {};
  @Input() procedureName: string = '';
  @Input() mode: 'view' | 'edit' | 'new' = 'edit';

  form: FormGroup = new FormGroup({});

  @Output() saved = new EventEmitter<any>();
  @Output() canceled = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();

  constructor(private api: ApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fields'] || changes['data'] || changes['mode']) {
      this.buildForm();
    }
  }

  private buildForm() {
    const controls: Record<string, FormControl> = {};

    this.fields.forEach((field: any) => {
      const value = this.data?.[field.key] ?? (field.type === 'select' ? null : '');
      const validators = field.required ? [Validators.required] : [];
      controls[field.key] = new FormControl(value, validators);
    });

    this.form = new FormGroup(controls);

    if (this.mode === 'view') {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  startEdit() {
    this.edit.emit();
  }

  save() {
    if (this.mode === 'view' || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    let params: any = {};
    const formValue = this.form.getRawValue();

    this.fields.forEach(field => {
      const parameterName = field.paramKey || field.key;
      params[parameterName] = formValue[field.key];
    });

    if (this.mode === 'edit' && this.data?.Id !== undefined && this.data?.Id !== null && params['Id'] === undefined) {
      params['Id'] = this.data.Id;
    }

    this.api.execute(this.procedureName, params)
      .subscribe((res: any) => {
        this.saved.emit({ mode: this.mode, data: formValue, result: res });
      });
  }

  cancel() {
    this.canceled.emit();
  }

}
