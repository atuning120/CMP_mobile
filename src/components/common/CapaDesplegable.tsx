import React, { createContext, useContext, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Aire que se deja entre la lista y el borde visible al desplazar para mostrarla
const MARGEN_VISIBLE = 12;

interface CapaDesplegableApi {
  // Ubica una vista en coordenadas de la capa donde se dibuja la lista
  medir: (vista: View, alMedir: (x: number, y: number, ancho: number, alto: number) => void) => void;
  mostrar: (id: string, contenido: React.ReactNode) => void;
  ocultar: (id: string) => void;
  // Alarga el contenido para que una lista abierta cerca del final quepa (y reciba toques) dentro de él
  reservar: (id: string, finLista: number) => void;
  // Desplaza lo justo para que el tramo [inicio, fin] de la capa quede a la vista
  asegurarVisible: (inicio: number, fin: number) => void;
  // Avisa cuando cambia el alto visible (teclado) o el del contenido, para volver a medir
  suscribir: (fn: () => void) => () => void;
}

const Contexto = createContext<CapaDesplegableApi | null>(null);

// null fuera de una capa: el selector despliega la lista en línea
export const useCapaDesplegable = () => useContext(Contexto);

interface SuperposicionHandle {
  mostrar: (id: string, contenido: React.ReactNode) => void;
  ocultar: (id: string) => void;
}

// El estado vive aquí y no en CapaDesplegable: cambiar la lista visible no vuelve a dibujar el formulario
const Superposicion: React.FC<{ ref: React.Ref<SuperposicionHandle> }> = ({ ref }) => {
  const [capa, setCapa] = useState<{ id: string; contenido: React.ReactNode } | null>(null);

  useImperativeHandle(ref, () => ({
    mostrar: (id, contenido) => setCapa({ id, contenido }),
    ocultar: (id) => setCapa((actual) => (actual?.id === id ? null : actual)),
  }), []);

  return (
    <View style={styles.superposicion} pointerEvents="box-none">
      {capa && (
        <Animated.View
          key={capa.id}
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(100)}
          style={StyleSheet.absoluteFill}
          pointerEvents="box-none"
        >
          {capa.contenido}
        </Animated.View>
      )}
    </View>
  );
};

interface EspaciadorHandle {
  fijar: (alto: number) => void;
}

const Espaciador: React.FC<{ ref: React.Ref<EspaciadorHandle> }> = ({ ref }) => {
  const [alto, setAlto] = useState(0);
  useImperativeHandle(ref, () => ({ fijar: setAlto }), []);
  return alto > 0 ? <View style={{ height: alto }} /> : null;
};

/**
 * ScrollView cuyos selectores dibujan su lista de opciones en una capa dentro del mismo contenido: la lista se
 * superpone a los campos de abajo en vez de estirar el formulario, y se desplaza junto con su campo sin tener
 * que volver a medir. Queda dentro de los límites del contenido porque en Android los toques fuera de los
 * límites del padre se pierden.
 */
export const CapaDesplegable: React.FC<ScrollViewProps> = ({ children, onScroll, onLayout, ...props }) => {
  const scroll = useRef<ScrollView>(null);
  // Ancestro de los campos y origen de la capa: measureLayout solo mide contra un ancestro
  const contenido = useRef<View>(null);
  const superposicion = useRef<SuperposicionHandle>(null);
  const espaciador = useRef<EspaciadorHandle>(null);
  const desplazamiento = useRef(0);
  const altoVisible = useRef(0);
  const altoContenido = useRef(0);
  // Posición del contenido dentro del ScrollView (el relleno de contentContainerStyle)
  const inicioContenido = useRef(0);
  const reserva = useRef<{ id: string; extra: number } | null>(null);
  // En estado y no en un ref: avisar se usa en los manejadores entregados durante el render
  const [oyentes] = useState(() => new Set<() => void>());

  const api = useMemo<CapaDesplegableApi>(() => ({
    medir: (vista, alMedir) => {
      if (contenido.current) vista.measureLayout(contenido.current, alMedir);
    },
    mostrar: (id, nodo) => superposicion.current?.mostrar(id, nodo),
    ocultar: (id) => {
      superposicion.current?.ocultar(id);
      if (reserva.current?.id === id) {
        reserva.current = null;
        espaciador.current?.fijar(0);
      }
    },
    reservar: (id, finLista) => {
      const extraActual = reserva.current?.extra ?? 0;
      const extra = Math.max(0, Math.ceil(finLista + MARGEN_VISIBLE - (altoContenido.current - extraActual)));
      if (reserva.current?.id === id && extra === extraActual) return;
      reserva.current = { id, extra };
      espaciador.current?.fijar(extra);
    },
    asegurarVisible: (inicio, fin) => {
      const visible = altoVisible.current;
      const actual = desplazamiento.current;
      if (visible <= 0) return;
      const desde = inicio + inicioContenido.current - MARGEN_VISIBLE;
      const hasta = fin + inicioContenido.current + MARGEN_VISIBLE;
      let destino = actual;
      if (hasta > actual + visible) destino = hasta - visible;
      // Si no cabe todo, manda el comienzo (el campo)
      if (desde < destino) destino = Math.max(0, desde);
      if (Math.abs(destino - actual) > 1) scroll.current?.scrollTo({ y: destino, animated: true });
    },
    suscribir: (fn) => {
      oyentes.add(fn);
      return () => {
        oyentes.delete(fn);
      };
    },
  }), [oyentes]);

  const avisar = () => oyentes.forEach((fn) => fn());

  return (
    <Contexto.Provider value={api}>
      <ScrollView
        ref={scroll}
        {...props}
        scrollEventThrottle={16}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          desplazamiento.current = e.nativeEvent.contentOffset.y;
          onScroll?.(e);
        }}
        onLayout={(e) => {
          altoVisible.current = e.nativeEvent.layout.height;
          avisar();
          onLayout?.(e);
        }}
      >
        <View
          ref={contenido}
          onLayout={(e) => {
            inicioContenido.current = e.nativeEvent.layout.y;
            altoContenido.current = e.nativeEvent.layout.height;
            avisar();
          }}
        >
          {children}
          <Espaciador ref={espaciador} />
          <Superposicion ref={superposicion} />
        </View>
      </ScrollView>
    </Contexto.Provider>
  );
};

const styles = StyleSheet.create({
  // Cubre todo el contenido y queda sobre los campos: comparte origen con la vista contra la que se mide
  superposicion: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
});
