import React from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Badge from '../components/Badge';
import Alert from '../components/Alert';

const TailwindTest: React.FC = () => {
  return (
    <Layout activeTab="test">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tailwind CSS Components Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <Card 
            title="Card Component" 
            footer={<div className="text-right"><Button>Action</Button></div>}
          >
            <p className="text-gray-600 mb-4">This is a card component styled with Tailwind CSS.</p>
            <div className="flex space-x-2">
              <Badge>Default</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="danger">Danger</Badge>
            </div>
          </Card>
          
          <Card title="Form Components">
            <div className="space-y-4">
              <Input 
                label="Text Input" 
                placeholder="Enter some text" 
                helperText="This is a helper text"
                fullWidth
              />
              
              <Select 
                label="Select Input"
                options={[
                  { value: '', label: 'Select an option', disabled: true },
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
                fullWidth
              />
            </div>
          </Card>
        </div>
        
        <div className="space-y-4 mb-8">
          <Alert title="Info Alert" variant="info">
            This is an informational alert message.
          </Alert>
          
          <Alert title="Success Alert" variant="success">
            This is a success alert message.
          </Alert>
          
          <Alert title="Warning Alert" variant="warning">
            This is a warning alert message.
          </Alert>
          
          <Alert title="Error Alert" variant="error" isDismissible>
            This is an error alert message that can be dismissed.
          </Alert>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Buttons</h2>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="info">Info</Button>
            <Button variant="light">Light</Button>
            <Button variant="dark">Dark</Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" isLoading>Loading</Button>
            <Button variant="primary" leftIcon={<i className="fa-solid fa-check"></i>}>With Icon</Button>
            <Button variant="primary" rightIcon={<i className="fa-solid fa-arrow-right"></i>}>With Icon</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TailwindTest; 