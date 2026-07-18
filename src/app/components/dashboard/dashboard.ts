import { Component, inject, OnInit, PLATFORM_ID, signal, ViewEncapsulation } from '@angular/core';
import { EvolucinCognitivaService, RespuestaPSC, ResumenDashboard } from '../../api/generated';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Dashboard implements OnInit {
  private readonly pscApi = inject(EvolucinCognitivaService);
  private readonly platformId = inject(PLATFORM_ID);

  vistaActiva = signal<'OPERATIVO' | 'ADMINISTRACION'>('OPERATIVO');

  // Signals del Estado Operativo
  datosConsolidado = signal<ResumenDashboard | null>(null);
  proyectoSeleccionado = signal<RespuestaPSC | null>(null);
  loading = signal<boolean>(false);

  // Signals de Administración
  pesoDesbalance = signal<number>(25);
  nuevoCasoCui = signal<number | null>(null);
  nuevoCasoResolucion = signal<string>('');

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.cargarDatosConsolidados();
    }
  }

  cargarDatosConsolidados(): void {
    this.loading.set(true);
    this.pscApi.obtenerDashboardConsolidadoApiPscDashboardConsolidadoGet().subscribe({
      next: (data: ResumenDashboard) => {
        this.datosConsolidado.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  seleccionarObraParaDiagnostico(cui: number): void {
    this.pscApi.evaluarEspecificoApiPscEvaluarEspecificoPost({ cui }).subscribe({
      next: (data: RespuestaPSC) => this.proyectoSeleccionado.set(data),
    });
  }

  cambiarVista(vista: 'OPERATIVO' | 'ADMINISTRACION'): void {
    this.vistaActiva.set(vista);
  }

  ejecutarRetencionCBR(): void {
    if (!this.nuevoCasoCui()) return;
    this.pscApi
      .retenerNuevoCasoApiPscMemoriaEpisodicaRetenerPost(
        this.nuevoCasoCui()!,
        this.nuevoCasoResolucion(),
      )
      .subscribe({
        next: () => {
          alert(`Experiencia indexada.`);
          this.nuevoCasoCui.set(null);
          this.nuevoCasoResolucion.set('');
        },
      });
  }

  procesarGobernanzaHumana(cui: number, decision: 'VALIDADO' | 'AJUSTADO', bitacora: string): void {
    const resolucionCompleta = `[Juicio Experto: ${decision}] - Decisión sobre CUI ${cui}: ${bitacora}`;
    console.log('Procesando gobernanza humana con los siguientes parámetros:');
    console.log(`CUI: ${cui}`);
    console.log(`Decisión: ${decision}`);
    console.log(`Bitácora: ${bitacora}`);
    console.log(`Resolución completa: ${resolucionCompleta}`);
    this.pscApi
      .retenerNuevoCasoApiPscMemoriaEpisodicaRetenerPost(cui, resolucionCompleta)
      .subscribe({
        next: (response) => {
          alert(
            `⚙️ [Gobernanza Cognitiva Ejecutada]\n\nLa recomendación ha sido ${decision} por el Especialista de Monitoreo.\nEl caso ha sido retenido con éxito en el backend para re-entrenar los pesos KNN.`,
          );

          // Limpiamos el panel de selección y refrescamos el listado general automáticamente
          this.proyectoSeleccionado.set(null);
          this.cargarDatosConsolidados();
        },
        error: () => {
          alert('❌ Error de comunicación con el búfer de retención del backend.');
        },
      });
  }
}
