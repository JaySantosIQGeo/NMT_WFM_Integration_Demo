import React from 'react';
import { useLocale } from 'myWorld-client/react';
import { Radio, Input } from 'myWorld-client/react';

//Takes the features object returned from the Database and build the object used by the Cascader React element
export const buildFeatureList = features => {
    let fieldsList = [];
    let featuresList = [];
    for (const feat in features) {
        //Iterates over the features object
        fieldsList = [];
        for (const field in features[feat].fields) {
            //For each feature, iterates over the fields object
            if (features[feat].fields[field].visible.value) {
                //If the field visible property is true, add it to the fieldsList array
                //Pushing the object into the array that is used by the Cascader React element
                //label: The name of the Field that is shown in the Cascader
                //value: The internal name of the field, later used to access the field value in the item object
                fieldsList.push({
                    label: features[feat].fields[field].external_name,
                    value: features[feat].fields[field].internal_name
                });
            }
        }
        //Builds the object that is actually used by the Cascader React element
        //label: The name of the Feature that is shown in the Cascader
        //value: the feature object itself
        //children: Object containing the objects used by the next level of the Cascader
        const featureListItem = {
            label: features[feat].external_name,
            value: feat,
            children: fieldsList
        };
        featuresList.push(featureListItem);
    }
    return featuresList;
};

//Receives (in order):
//- The value of the field selected by the user
//- The rule selected by the user
//- The value inputted by the user
export const validate = (fieldValue, pickedRule, inputtedValue) => {
    if (fieldValue && inputtedValue) {
        //This const contains the definition of the rules that can be selected by the user
        const rules = {
            '>': (fieldValue, inputtedValue) => Number(fieldValue) > Number(inputtedValue),
            '<': (fieldValue, inputtedValue) => Number(fieldValue) < Number(inputtedValue),
            true: fieldValue => fieldValue,
            false: fieldValue => !fieldValue,
            have: (fieldValue, inputtedValue) => fieldValue.includes(inputtedValue),
            notHave: (fieldValue, inputtedValue) => !fieldValue.includes(inputtedValue)
        };

        if (rules[pickedRule]) {
            //The function returns the bolean value of the rule selected by the user
            return rules[pickedRule](fieldValue, inputtedValue);
        } else {
            throw new Error(`Unknown rule: ${pickedRule}`);
        }
    } else {
        return false;
    }
};

//Build the HTML code for the input fields, receive as parameters:
//- radioOptions: An object containing the options for the radio buttons
//- setRuleFunction: A reference to the function that sets the rule state when the user selects a radio button
//- inputPlaceholder: A string that is shown as a placeholder in the input field, defaults to null since some rules do not require an input field
//- valueState: A reference to the state that holds the value inputted by the user
//- onValueChangeFunction: A reference to the function that sets the value state when the user types in the input field
export const buildFields = (
    radioOptions,
    setRuleFunction,
    inputPlaceholder = null,
    valueState = null,
    onValueChangeFunction = null
) => {
    const { msg } = useLocale('customRuleModal');
    return (
        <div>
            <br />
            <strong>{msg('rule_title')}</strong>
            <Radio.Group
                optionType="button"
                buttonStyle="solid"
                onChange={e => setRuleFunction(e.target.value)}
            >
                {radioOptions.map(option => (
                    <Radio key={option.value} value={option.value}>
                        {option.label}
                    </Radio>
                ))}
            </Radio.Group>
            {inputPlaceholder && (
                <div>
                    <br />
                    <strong>{msg('value_title')}</strong>
                    <Input
                        placeholder={inputPlaceholder}
                        value={valueState}
                        onChange={onValueChangeFunction}
                    />
                </div>
            )}
        </div>
    );
};

//Creates the object that will be used to create the WFM ticket in the database, receives as parameters:
//- featureObj: Object containing the feature that will be used to create the ticket
//- rule: Rule selected by the user
//- pickedField: The feature's field selected by the user
//- value: The value inputted by the user
//- pickedFeature: The name of feature selected by the user
export const createTicketObject = (featureObj, rule, pickedField, value, pickedFeature) => {
    const { msg } = useLocale('customRuleModal'); //the msg const allows the use of the localised messages
    let ruleStr = '';
    switch (
        rule //This switch statement is used to build the part of the string that describes the rule selected by the user
    ) {
        case '<':
            ruleStr = msg('less_than');
            break;
        case '>':
            ruleStr = msg('more_than');
            break;
        case 'true':
            ruleStr = msg('true');
            break;
        case 'false':
            ruleStr = msg('false');
            break;
        case 'have':
            ruleStr = msg('have');
            break;
        case 'notHave':
            ruleStr = msg('not_have');
            break;
    }

    //With the rule subtring set, the string describing the issue can be created
    const issueStr =
        msg('value_of') +
        pickedFeature +
        ' - ' +
        pickedField +
        msg('is') +
        featureObj.properties[pickedField] +
        ruleStr +
        ' ' +
        value;

    //Builds and returns the ticket object that will be used to create the ticket in the database
    const ticketObj = {
        geometry_type: 'Point',
        id: 'Null',
        mywwfm_assigned_username: 'admin',
        // mywwfm_cause: 'Broken Custom Rule',
        mywwfm_cause: msg('cause'),
        mywwfm_geomety_features: featureObj.geometry.coordinates,
        mywwfm_indicator: msg('medium'),
        mywwfm_issue: issueStr,
        mywwfm_last_modified_datetime: undefined,
        mywwfm_node: msg('node'),
        mywwfm_project: 'mywwfm_project/1',
        mywwfm_project_name: null,
        mywwfm_region: 'South',
        mywwfm_related_feature: null,
        mywwfm_source_system: null,
        mywwfm_status: 'Open',
        mywwfm_ticket_details: msg('default_ticket_details'),
        mywwfm_ticket_group: ['admin:Default'],
        mywwfm_type: 'Trouble Ticket',
        mywwfm_type_category: msg('default_category')
    };
    return ticketObj;
};
