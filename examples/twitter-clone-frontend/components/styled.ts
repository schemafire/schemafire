import css from '@emotion/css';
import Styled, { CreateStyled } from '@emotion/styled';
import { Cast } from '@schemafire/core';

export const styled: CreateStyled<{}> = Cast(Styled);
