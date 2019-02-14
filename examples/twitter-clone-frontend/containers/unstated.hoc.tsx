// import hoistNonReactStatics from 'hoist-non-react-statics';
// import React from 'react';
// import { Subscribe, Container } from 'unstated';

// function withContainers(...Containers) {
//   return function wrapper(WrappedComponent) {
//     return class ContainersProvider extends React.Component<any, any> {
//       public render() {
//         return (
//           <Subscribe to={[...Containers]}>
//             {(...containers) => (
//               <WrappedComponent containers={containers} container={containers[0]} {...this.props} />
//             )}
//           </Subscribe>
//         );
//       }
//     } as any;
//   };
//   // return hoistNonReactStatics(EnhancedComponent, Wrapped);
// }

// export default withContainers;
