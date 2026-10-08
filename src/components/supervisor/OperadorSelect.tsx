import React from 'react';
import type { OperadoresAsignables } from '../../hooks/useOperadoresAsignables';
import type { OperadorAsignableApi } from '../../services/flotaService';
import { SearchableSelect } from '../common/SearchableSelect';

interface Props {
  operadores: OperadoresAsignables;
  // Id del operador elegido como texto ('' = sin operador), como lo guardan los formularios
  valor: string;
  onChange: (idOperador: string) => void;
  // Máquina que recibirá al operador: si ya está a cargo de otra, se avisa que se mueve
  idMaquina?: number;
  label?: string;
}

// Accesores estables para SearchableSelect (evitan recalcular la búsqueda en cada render)
const idOperador = (operador: OperadorAsignableApi) => operador.idOperador;
const nombreOperador = (operador: OperadorAsignableApi) => operador.nombre;
const descripcionOperador = (operador: OperadorAsignableApi) =>
  `${operador.rut} · ${operador.maquinaAsignada ? `a cargo de ${operador.maquinaAsignada.nombre}` : 'sin máquina asignada'}`;

// Selector "Operador asignado": la X deja la máquina sin operador
export const OperadorSelect: React.FC<Props> = ({ operadores, valor, onChange, idMaquina, label = 'OPERADOR ASIGNADO (OPCIONAL)' }) => {
  const elegido = operadores.operadores.find((o) => String(o.idOperador) === valor) ?? null;
  const anterior = elegido?.maquinaAsignada;
  const seMueve = !!anterior && anterior.idMaquina !== idMaquina;

  return (
    <SearchableSelect
      label={label}
      placeholder="Buscar operador por nombre o RUT..."
      options={operadores.operadores}
      value={elegido}
      onChange={(operador) => onChange(operador ? String(operador.idOperador) : '')}
      getOptionKey={idOperador}
      getOptionLabel={nombreOperador}
      getOptionDescription={descripcionOperador}
      isLoading={operadores.cargando}
      error={operadores.error}
      onRetry={operadores.reintentar}
      emptyMessage="No hay operadores registrados"
      hint={
        seMueve && elegido
          ? `${elegido.nombre} está a cargo de ${anterior.nombre}: pasará a esta máquina.`
          : 'Tendrá esta máquina preseleccionada al iniciar turno.'
      }
    />
  );
};
