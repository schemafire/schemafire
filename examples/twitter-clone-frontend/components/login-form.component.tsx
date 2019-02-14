import React, { FunctionComponent } from 'react';

import { AuthContainer } from '@containers/auth.container';
import withContainers from '@containers/unstated.hoc';
import styled from '@emotion/styled';
import { Form, Formik, FormikConfig } from 'formik';
import { Button, Form as SemanticForm, Grid, Header, Image, Message, Segment } from 'semantic-ui-react';
import isEmail from 'validator/lib/isEmail';

const LoginFormWrapper = styled('div')`
  height: 100%;
`;

enum FieldName {
  Email = 'email',
  Password = 'password',
}

type FormData = Record<FieldName, string> & object;

interface LoginFormProps {
  auth: AuthContainer;
}

const validate: FormikConfig<FormData>['validate'] = ({ email, password }) => {
  return {
    email: isEmail(email) ? undefined : 'The email entered is invalid',
    password: password.length >= 6 ? undefined : 'Password too short',
  };
};

const LoginFormComponent: FunctionComponent<LoginFormProps> = ({ auth }) => {
  const onSubmit: FormikConfig<FormData>['onSubmit'] = ({ email, password }, { setSubmitting }) => {
    console.log('submitted');
    auth.loginViaEmail({ email, password }).then(
      () => {
        console.log('Successful login');
        setSubmitting(false);
      },
      error => {
        setSubmitting(false);
        console.error(error);
      },
    );
  };

  return (
    <LoginFormWrapper>
      <Grid textAlign='center' style={{ height: '100%' }} verticalAlign='middle'>
        <Grid.Column style={{ maxWidth: 450 }}>
          <Header as='h2' color='teal' textAlign='center'>
            <Image src='/static/logo.png' /> Log-in to your account
          </Header>
          <Formik initialValues={{ email: '', password: '' }} validate={validate} onSubmit={onSubmit}>
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
              setSubmitting,
            }) => {
              return (
                <SemanticForm size='large' onSubmit={handleSubmit} as={Form}>
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
                    <Button
                      color='teal'
                      fluid={true}
                      size='large'
                      type='submit'
                      disabled={isSubmitting}
                      // tslint:disable-next-line:jsx-no-lambda
                      onClick={() => onSubmit(values, { setSubmitting })}
                    >
                      Login
                    </Button>
                  </Segment>
                </SemanticForm>
              );
            }}
          </Formik>
          <Message>
            New to us? <a href='#'>Sign Up</a>
          </Message>
        </Grid.Column>
      </Grid>
    </LoginFormWrapper>
    // null
  );
};

export const LoginForm = withContainers({ auth: AuthContainer })(LoginFormComponent);
