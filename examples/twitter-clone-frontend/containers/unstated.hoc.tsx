import { Cast, Omit } from '@schemafire/core';

import hoistNonReactStatics from 'hoist-non-react-statics';
import React, { ComponentType, FunctionComponent } from 'react';
import { Container, ContainerType, Subscribe } from 'unstated';

interface ContainerObject {
  [key: string]: Container<any> | ContainerType<any>;
}

type TransformToInstance<GObj extends ContainerObject> = {
  [P in keyof GObj]: GObj[P] extends ContainerType<any> ? Container<any> : Container<any>
};

const withContainers = <GContainers extends ContainerObject>(containers: GContainers) => {
  interface ContainerKeyMap {
    containerArray: Array<Container<any> | ContainerType<any>>;
    keyMap: Record<number, keyof GContainers>;
  }

  const containerKeyMap: ContainerKeyMap = Object.entries(containers).reduce<ContainerKeyMap>(
    ({ containerArray, keyMap }, [key, container], index) => {
      return {
        containerArray: [...containerArray, container],
        keyMap: { ...keyMap, [index]: key },
      };
    },
    { containerArray: [], keyMap: {} },
  );

  return <GProps extends TransformToInstance<GContainers>>(Wrapped: ComponentType<GProps>) => {
    const EnhancedComponent: FunctionComponent<Omit<GProps, keyof GContainers>> = props => {
      return (
        <Subscribe to={[...containerKeyMap.containerArray]}>
          {(...containerArray) => {
            // Join the props back together as an object that can be spread into the component
            const containerProps = containerArray.reduce((prev, container, index) => {
              return {
                ...prev,
                [containerKeyMap.keyMap[index]]: container,
              };
            }, Cast<GContainers>({}));

            return <Wrapped {...containerProps} {...Cast(props)} />;
          }}
        </Subscribe>
      );
    };

    return hoistNonReactStatics(EnhancedComponent, Wrapped);
  };
};

export default withContainers;
