/// <reference types="react" />
interface AppProps {
    name: string;
}
declare type ContainerProps = {
    padding?: string | 0;
    margin?: string | 0;
};
export declare const Container: import("styled-components").StyledComponent<"div", any, ContainerProps, never>;
export default function App({ name }: AppProps): JSX.Element;
export {};
