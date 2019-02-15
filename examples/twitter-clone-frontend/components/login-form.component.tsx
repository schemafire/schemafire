import React, { FC, FunctionComponent } from 'react';

import { AuthContainer } from '@containers/auth.container';
import withContainers from '@containers/unstated.hoc';
import styled from '@emotion/styled';
import { Formik, FormikConfig } from 'formik';
import Link from 'next/link';
import { Button, Form as SemanticForm, Grid, Header, Image, Message, Segment } from 'semantic-ui-react';
import isEmail from 'validator/lib/isEmail';

const AuthFormWrapper = styled('div')`
  height: 100%;
`;

enum FieldName {
  Email = 'email',
  Password = 'password',
}

type FormData = Record<FieldName, string> & object;

interface AuthFormProps {
  auth: AuthContainer;
  mode: 'login' | 'create';
}

const validate: FormikConfig<FormData>['validate'] = ({ email, password }) => {
  const errors: Partial<FormData> = {};
  if (!isEmail(email)) {
    errors.email = 'The email entered is invalid';
  }

  if (password.length <= 5) {
    errors.password = 'Password too short';
  }
  return errors;
};

const AuthFormComponent: FunctionComponent<AuthFormProps> = ({ auth, mode }) => {
  const header = mode === 'create' ? 'Create a new account' : 'Log-in to your account';
  const button = mode === 'create' ? 'Register' : 'Login';

  const onSubmit: FormikConfig<FormData>['onSubmit'] = async ({ email, password }, { setSubmitting }) => {
    try {
      await auth.loginViaEmail({ email, password, create: mode === 'create' });
      setSubmitting(false);
      console.log('Successful login');
    } catch (error) {
      setSubmitting(false);
      console.error(error);
    }
  };

  return (
    <AuthFormWrapper>
      <Grid textAlign='center' style={{ height: '100%' }} verticalAlign='middle'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as='h2' color='teal' textAlign='center'>
            <Image src='/static/logo.png' /> {header}
          </Header>
          <Formik initialValues={{ email: '', password: '' }} validate={validate} onSubmit={onSubmit}>
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => {
              return (
                <SemanticForm size='large' onSubmit={handleSubmit}>
                  <Segment stacked={true}>
                    <SemanticForm.Input
                      fluid={true}
                      icon='user'
                      iconPosition='left'
                      placeholder='E-mail address'
                      error={Boolean(errors.email && touched.email)}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.email}
                      type='email'
                      name='email'
                    />
                    <SemanticForm.Input
                      fluid={true}
                      icon='lock'
                      iconPosition='left'
                      placeholder='Password'
                      type='password'
                      error={Boolean(errors.password && touched.password)}
                      name='password'
                      onChange={handleChange}
                      onBlur={handleBlur}
                      value={values.password}
                    />
                    <Button color='teal' fluid={true} size='large' type='submit' disabled={isSubmitting}>
                      {button}
                    </Button>
                  </Segment>
                </SemanticForm>
              );
            }}
          </Formik>
          <SwitchAuthenticationMode mode={mode} />
        </Grid.Column>
      </Grid>
    </AuthFormWrapper>
    // null
  );
};

const SwitchAuthenticationMode: FC<Pick<AuthFormProps, 'mode'>> = ({ mode }) =>
  mode === 'login' ? (
    <Message>
      New to us?{' '}
      <Link href='/register'>
        <a>Register</a>
      </Link>
    </Message>
  ) : (
    <Message>
      Already have an account?{' '}
      <Link href='/login'>
        <a>Login</a>
      </Link>
    </Message>
  );

export const AuthForm = withContainers({ auth: AuthContainer })(AuthFormComponent);
